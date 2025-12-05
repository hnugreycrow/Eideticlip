!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "nsDialogs.nsh"

Var CreateDesktopShortcut

; -------------------------------------
;   自定义目录验证（electron-builder 默认逻辑）
; -------------------------------------
Function .onVerifyInstDir
  ${IfNot} ${FileExists} "$INSTDIR\${APP_FILENAME}\*"
    StrCpy $INSTDIR "$INSTDIR\${APP_FILENAME}"
  ${EndIf}
FunctionEnd

; -----------------------------
; 自定义页面：选择是否创建桌面快捷方式
; -----------------------------
Function CreateShortcutPage
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}

  !insertmacro MUI_HEADER_TEXT "快捷方式设置" "选择是否创建桌面快捷方式"

  ${NSD_CreateCheckbox} 0 20u 100% 10u "创建桌面快捷方式(&D)"
  Pop $CreateDesktopShortcut
  ${NSD_Check} $CreateDesktopShortcut

  nsDialogs::Show
FunctionEnd

Function CreateShortcutPageLeave
  ${NSD_GetState} $CreateDesktopShortcut $0
  ${If} $0 == ${BST_CHECKED}
    StrCpy $CreateDesktopShortcut 1
  ${Else}
    StrCpy $CreateDesktopShortcut 0
  ${EndIf}
FunctionEnd

PageEx custom
  PageCallbacks CreateShortcutPage CreateShortcutPageLeave
PageExEnd

; -----------------------------
; 安装完成后创建桌面快捷方式
; -----------------------------
!macro customInstall
  ${If} $CreateDesktopShortcut == 1
    CreateShortcut "$DESKTOP\${APP_FILENAME}.lnk" "$INSTDIR\${APP_FILENAME}.exe"
  ${EndIf}
!macroend

; -----------------------------
; 卸载时清理桌面快捷方式
; -----------------------------
!macro customUnInstall
  Delete "$DESKTOP\${APP_FILENAME}.lnk"
!macroend
