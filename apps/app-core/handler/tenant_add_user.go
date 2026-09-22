package handler

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/Tencent/WeKnora/apps/app-core/application/service"
	apperrors "github.com/Tencent/WeKnora/apps/app-core/errors"
	"github.com/Tencent/WeKnora/apps/app-core/logger"
	"github.com/Tencent/WeKnora/apps/app-core/types"
)

// TenantAddUserHandler 提供租户内直接开账号、编辑成员资料的接口。
// 不改动原有邀请和按邮箱直加成员的路由。
type TenantAddUserHandler struct {
	svc *service.TenantAddUserService
}

// NewTenantAddUserHandler 组装处理器。
func NewTenantAddUserHandler(svc *service.TenantAddUserService) *TenantAddUserHandler {
	return &TenantAddUserHandler{svc: svc}
}

type addTenantUserBody struct {
	Username string           `json:"username"`
	Account  string           `json:"account"`
	Email    string           `json:"email"`
	Password string           `json:"password"`
	Role     types.TenantRole `json:"role"`
}

type updateTenantUserBody struct {
	Username string           `json:"username"`
	Account  string           `json:"account"`
	Email    string           `json:"email"`
	Role     types.TenantRole `json:"role"`
}

// AddUser 在当前租户创建用户并加入成员。
// POST /api/v1/tenants/:id/add-users
func (h *TenantAddUserHandler) AddUser(c *gin.Context) {
	ctx := c.Request.Context()
	tenantID, ok := parseTenantIDFromPath(c)
	if !ok {
		return
	}
	var body addTenantUserBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.Error(apperrors.NewValidationError("invalid request body").WithDetails(err.Error()))
		return
	}
	user, member, err := h.svc.AddUser(ctx, tenantID, &service.AddTenantUserRequest{
		Username: body.Username,
		Account:  body.Account,
		Email:    body.Email,
		Password: body.Password,
		Role:     body.Role,
	})
	if err != nil {
		writeTenantAddUserError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    tenantMemberFromUser(user, member),
	})
}

// UpdateUser 编辑成员的用户名、邮箱和角色。登录账号不可修改。
// PUT /api/v1/tenants/:id/add-users/:user_id
func (h *TenantAddUserHandler) UpdateUser(c *gin.Context) {
	ctx := c.Request.Context()
	tenantID, ok := parseTenantIDFromPath(c)
	if !ok {
		return
	}
	userID := strings.TrimSpace(c.Param("user_id"))
	if userID == "" {
		c.Error(apperrors.NewValidationError("user_id is required"))
		return
	}
	var body updateTenantUserBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.Error(apperrors.NewValidationError("invalid request body").WithDetails(err.Error()))
		return
	}
	user, member, err := h.svc.UpdateUser(ctx, tenantID, userID, &service.UpdateTenantUserRequest{
		Username: body.Username,
		Account:  body.Account,
		Email:    body.Email,
		Role:     body.Role,
	})
	if err != nil {
		writeTenantAddUserError(c, err)
		return
	}
	logger.Infof(ctx, "已更新租户成员: tenant=%d user=%s", tenantID, userID)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    tenantMemberFromUser(user, member),
	})
}

func tenantMemberFromUser(user *types.User, member *types.TenantMember) types.TenantMemberResponse {
	row := types.TenantMemberResponse{Account: accountString(user)}
	if user != nil {
		row.UserID = user.ID
		row.Email = user.Email
		row.Username = user.Username
		row.Avatar = user.Avatar
	}
	if member != nil {
		row.UserID = member.UserID
		row.Role = member.Role
		row.Status = member.Status
		row.InvitedBy = member.InvitedBy
		row.JoinedAt = member.JoinedAt
	}
	return row
}

func accountString(user *types.User) string {
	if user == nil || user.Account == nil {
		return ""
	}
	return *user.Account
}

func writeTenantAddUserError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrInvalidAccount):
		c.Error(apperrors.NewValidationError(err.Error()).WithDetails(service.DetailAccountInvalid))
	case errors.Is(err, service.ErrInvalidUsername):
		c.Error(apperrors.NewValidationError(err.Error()).WithDetails(service.DetailUsernameInvalid))
	case errors.Is(err, service.ErrInvalidEmail):
		c.Error(apperrors.NewValidationError(err.Error()).WithDetails(service.DetailEmailInvalid))
	case errors.Is(err, service.ErrInvalidTenantRole):
		c.Error(apperrors.NewValidationError("role must be one of owner/admin/contributor/viewer"))
	case service.IsPasswordPolicyError(err):
		c.Error(apperrors.NewValidationError(err.Error()).WithDetails(service.DetailPasswordPolicy))
	case errors.Is(err, service.ErrAccountImmutable):
		c.Error(apperrors.NewConflictError(err.Error()).WithDetails(service.DetailAccountImmutable))
	case errors.Is(err, service.ErrUserAccountExists):
		c.Error(apperrors.NewConflictError(err.Error()).WithDetails(service.DetailAccountExists))
	case errors.Is(err, service.ErrUserUsernameExists):
		c.Error(apperrors.NewConflictError(err.Error()).WithDetails(service.DetailUsernameExists))
	case errors.Is(err, service.ErrUserEmailExists):
		c.Error(apperrors.NewConflictError(err.Error()).WithDetails(service.DetailEmailExists))
	case errors.Is(err, service.ErrMembershipAlreadyExists):
		c.Error(apperrors.NewConflictError(err.Error()).WithDetails("already_member"))
	case errors.Is(err, service.ErrLastOwner):
		c.Error(apperrors.NewConflictError(err.Error()).WithDetails("last_owner"))
	case errors.Is(err, service.ErrAPIKeyCannotAssignOwner):
		c.Error(apperrors.NewForbiddenError(err.Error()))
	case errors.Is(err, service.ErrMembershipNotFound):
		c.Error(apperrors.NewNotFoundError("membership not found"))
	default:
		logger.Errorf(c.Request.Context(), "租户成员写入失败: %v", err)
		c.Error(apperrors.NewInternalServerError("failed to save member").WithDetails(err.Error()))
	}
}
