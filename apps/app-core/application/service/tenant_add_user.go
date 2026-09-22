package service

import (
	"context"
	"errors"
	"net/mail"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/Tencent/WeKnora/apps/app-core/config"
	"github.com/Tencent/WeKnora/apps/app-core/logger"
	"github.com/Tencent/WeKnora/apps/app-core/types"
	"github.com/Tencent/WeKnora/apps/app-core/types/interfaces"
)

var (
	// 与注册页用户名规则一致：字母、数字、下划线、中文。长度另限 2-20。
	tenantUsernamePattern = regexp.MustCompile(`^[a-zA-Z0-9_\x{4e00}-\x{9fa5}]+$`)
	// 登录账号只允许字母和数字，长度不超过 20。
	tenantAccountPattern = regexp.MustCompile(`^[A-Za-z0-9]{1,20}$`)

	// ErrUserAccountExists 登录账号已被占用。
	ErrUserAccountExists = errors.New("user with this account already exists")
	// ErrInvalidAccount 登录账号格式不合法。
	ErrInvalidAccount = errors.New("invalid login account")
	// ErrInvalidUsername 用户名格式不合法。
	ErrInvalidUsername = errors.New("invalid username")
	// ErrInvalidEmail 邮箱格式不合法。
	ErrInvalidEmail = errors.New("invalid email")
	// ErrAccountImmutable 登录账号已设置，不能再改。
	ErrAccountImmutable = errors.New("login account cannot be changed")
)

const (
	// DetailAccountExists 登录账号重复。
	DetailAccountExists = "account_exists"
	// DetailUsernameExists 用户名重复。
	DetailUsernameExists = "username_exists"
	// DetailEmailExists 邮箱重复。
	DetailEmailExists = "email_exists"
	// DetailAccountInvalid 登录账号格式错误。
	DetailAccountInvalid = "account_invalid"
	// DetailUsernameInvalid 用户名格式错误。
	DetailUsernameInvalid = "username_invalid"
	// DetailEmailInvalid 邮箱格式错误。
	DetailEmailInvalid = "email_invalid"
	// DetailAccountImmutable 登录账号已锁定。
	DetailAccountImmutable = "account_locked"
)

// AddTenantUserRequest 是租户内直接开账号的参数。
type AddTenantUserRequest struct {
	Username string
	Account  string
	Email    string
	Password string
	Role     types.TenantRole
}

// UpdateTenantUserRequest 编辑成员资料。已有登录账号不可改；为空时可以补填。不接收密码。
type UpdateTenantUserRequest struct {
	Username string
	Account  string
	Email    string
	Role     types.TenantRole
}

// TenantAddUserService 在当前租户内创建或编辑本地用户，不走邀请。
type TenantAddUserService struct {
	users    interfaces.UserRepository
	members  interfaces.TenantMemberService
	config   *config.Config
	settings interfaces.SystemSettingService
}

// NewTenantAddUserService 组装租户开账号服务。
func NewTenantAddUserService(
	users interfaces.UserRepository,
	members interfaces.TenantMemberService,
	cfg *config.Config,
	settings interfaces.SystemSettingService,
) *TenantAddUserService {
	return &TenantAddUserService{
		users:    users,
		members:  members,
		config:   cfg,
		settings: settings,
	}
}

// AddUser 创建用户并加入当前租户，不另建个人空间。
func (s *TenantAddUserService) AddUser(
	ctx context.Context,
	tenantID uint64,
	req *AddTenantUserRequest,
) (*types.User, *types.TenantMember, error) {
	if req == nil {
		return nil, nil, errors.New("request is required")
	}
	username := strings.TrimSpace(req.Username)
	account := strings.TrimSpace(req.Account)
	email := strings.TrimSpace(req.Email)
	if err := validateTenantUsername(username); err != nil {
		return nil, nil, err
	}
	if !tenantAccountPattern.MatchString(account) {
		return nil, nil, ErrInvalidAccount
	}
	if err := validateTenantEmail(email); err != nil {
		return nil, nil, err
	}
	if !req.Role.IsValid() {
		return nil, nil, ErrInvalidTenantRole
	}
	if err := ValidatePasswordPolicy(req.Password, s.complexPasswordEnabled(ctx)); err != nil {
		return nil, nil, err
	}
	if err := s.ensureIdentityAvailable(ctx, username, account, email, ""); err != nil {
		return nil, nil, err
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, nil, errors.New("failed to process password")
	}
	now := time.Now()
	user := &types.User{
		ID:           uuid.New().String(),
		Username:     username,
		Account:      &account,
		Email:        email,
		PasswordHash: string(hashed),
		IsActive:     true,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	if err := s.users.CreateUser(ctx, user); err != nil {
		logger.Errorf(ctx, "创建租户用户失败: %v", err)
		return nil, nil, errors.New("failed to create user")
	}

	caller, _ := types.UserIDFromContext(ctx)
	var invitedBy *string
	if caller != "" && !types.IsSyntheticUserID(caller) {
		invitedBy = &caller
	}
	member, err := s.members.AddMember(ctx, user.ID, tenantID, req.Role, invitedBy)
	if err != nil {
		s.rollbackCreatedUser(ctx, user.ID)
		return nil, nil, err
	}
	return user, member, nil
}

// UpdateUser 修改成员的用户名、邮箱和角色。登录账号仅在当前为空时可以补填，补填后不可再改。邮箱全局不可重复。
func (s *TenantAddUserService) UpdateUser(
	ctx context.Context,
	tenantID uint64,
	userID string,
	req *UpdateTenantUserRequest,
) (*types.User, *types.TenantMember, error) {
	if req == nil {
		return nil, nil, errors.New("request is required")
	}
	userID = strings.TrimSpace(userID)
	if userID == "" {
		return nil, nil, ErrMembershipNotFound
	}
	username := strings.TrimSpace(req.Username)
	email := strings.TrimSpace(req.Email)
	account := strings.TrimSpace(req.Account)
	if err := validateTenantUsername(username); err != nil {
		return nil, nil, err
	}
	if err := validateTenantEmail(email); err != nil {
		return nil, nil, err
	}
	if !req.Role.IsValid() {
		return nil, nil, ErrInvalidTenantRole
	}

	member, err := s.members.GetMembership(ctx, userID, tenantID)
	if err != nil {
		return nil, nil, err
	}
	if member == nil || member.Status != types.TenantMemberStatusActive {
		return nil, nil, ErrMembershipNotFound
	}
	user, err := s.users.GetUserByID(ctx, userID)
	if err != nil {
		if isUserLookupNotFound(err) {
			return nil, nil, ErrMembershipNotFound
		}
		return nil, nil, err
	}
	if user == nil {
		return nil, nil, ErrMembershipNotFound
	}
	currentAccount := ""
	if user.Account != nil {
		currentAccount = strings.TrimSpace(*user.Account)
	}
	if currentAccount != "" {
		if account != "" && account != currentAccount {
			return nil, nil, ErrAccountImmutable
		}
		account = ""
	} else if account != "" && !tenantAccountPattern.MatchString(account) {
		return nil, nil, ErrInvalidAccount
	}
	if err := s.ensureIdentityAvailable(ctx, username, account, email, user.ID); err != nil {
		return nil, nil, err
	}

	if err := s.members.UpdateRole(ctx, userID, tenantID, req.Role); err != nil {
		return nil, nil, err
	}
	user.Username = username
	user.Email = email
	if currentAccount == "" && account != "" {
		user.Account = &account
	}
	user.UpdatedAt = time.Now()
	if err := s.users.UpdateUser(ctx, user); err != nil {
		logger.Errorf(ctx, "更新租户用户失败: user=%s err=%v", userID, err)
		return nil, nil, errors.New("failed to update user")
	}
	member.Role = req.Role
	return user, member, nil
}

func (s *TenantAddUserService) complexPasswordEnabled(ctx context.Context) bool {
	return ResolveComplexPasswordEnabled(ctx, s.config, s.settings)
}

func (s *TenantAddUserService) ensureIdentityAvailable(
	ctx context.Context,
	username, account, email, selfID string,
) error {
	if username != "" {
		existing, err := s.users.GetUserByUsername(ctx, username)
		if err != nil && !isUserLookupNotFound(err) {
			return err
		}
		if existing != nil && existing.ID != selfID {
			return ErrUserUsernameExists
		}
	}
	if account != "" {
		existing, err := s.users.GetUserByAccount(ctx, account)
		if err != nil && !isUserLookupNotFound(err) {
			return err
		}
		if existing != nil && existing.ID != selfID {
			return ErrUserAccountExists
		}
	}
	if email != "" {
		existing, err := s.users.GetUserByEmail(ctx, email)
		if err != nil && !isUserLookupNotFound(err) {
			return err
		}
		if existing != nil && existing.ID != selfID {
			return ErrUserEmailExists
		}
	}
	return nil
}

func (s *TenantAddUserService) rollbackCreatedUser(ctx context.Context, userID string) {
	if deleter, ok := s.users.(interface {
		HardDeleteUser(context.Context, string) error
	}); ok {
		if err := deleter.HardDeleteUser(ctx, userID); err != nil {
			logger.Errorf(ctx, "回滚新建用户失败: user=%s err=%v", userID, err)
		}
		return
	}
	if err := s.users.DeleteUser(ctx, userID); err != nil {
		logger.Errorf(ctx, "回滚新建用户失败: user=%s err=%v", userID, err)
	}
}

func validateTenantUsername(username string) error {
	n := utf8.RuneCountInString(username)
	if n < 2 || n > 20 || !tenantUsernamePattern.MatchString(username) {
		return ErrInvalidUsername
	}
	return nil
}

func validateTenantEmail(email string) error {
	if email == "" || len(email) > 255 || strings.ContainsAny(email, " \t\r\n") {
		return ErrInvalidEmail
	}
	addr, err := mail.ParseAddress(email)
	if err != nil || addr.Address != email || !strings.Contains(email, "@") {
		return ErrInvalidEmail
	}
	return nil
}
