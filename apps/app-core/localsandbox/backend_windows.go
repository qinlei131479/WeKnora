//go:build windows

package localsandbox

import (
	"github.com/Tencent/WeKnora/apps/app-core/localsandbox/core"
	"github.com/Tencent/WeKnora/apps/app-core/localsandbox/winhost"
)

func NewBackend() (core.Backend, error) { return winhost.New() }
