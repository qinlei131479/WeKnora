package router

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Tencent/WeKnora/apps/app-core/handler"
)

// RegisterTenantAddUserRoutes 注册租户内直接开账号的企业接口。
// 与原有 /members、/invitations 并存，避免后续合并上游时改到邀请链路。
func RegisterTenantAddUserRoutes(r *gin.RouterGroup, h *handler.TenantAddUserHandler, g *rbacGuards) {
	if h == nil || g == nil {
		return
	}
	// 挂在 /api/v1 上，与已有 /tenants/:id 分组共用同一个路径参数名，避免再开一组。
	policy := apiKeyManageMembers(apiKeyFullAccess())
	g.apiKeyRoute(r, http.MethodPost, "/tenants/:id/add-users", policy, g.PathTenantMatch(), g.Owner(), h.AddUser)
	g.apiKeyRoute(r, http.MethodPut, "/tenants/:id/add-users/:user_id", policy, g.PathTenantMatch(), g.Owner(), h.UpdateUser)
}
