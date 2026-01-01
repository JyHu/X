# 生成常量

![](./imgs/img24.png)

## 功能概述

生成常量是 TransX 提供的代码集成辅助功能，能够根据在偏好设置中定义的命名规则，自动为本地化 Key 生成符合编程规范的常量标识符。此功能是连接本地化内容与应用代码的重要桥梁，实现了从本地化键值到代码常量的自动化转换。

**核心价值**：
- **消除硬编码**：用类型安全的常量替代容易出错的字符串字面量
- **编译期检查**：IDE 可在编译时发现拼写错误，避免运行时才暴露问题
- **重构友好**：统一管理常量定义，支持批量修改和 IDE 智能重构
- **代码规范**：统一团队的常量命名风格，提升代码可维护性
- **开发效率**：提供代码自动补全和智能提示，减少记忆负担

生成的常量可直接应用于 Swift、Objective-C 等项目代码中，是构建健壮本地化架构的基础设施。

## 功能价值

### 代码质量提升

**避免硬编码字符串**：
```swift
// 不推荐：硬编码字符串，容易拼写错误
let text = NSLocalizedString("com.app.login.button.submit", comment: "")

// 推荐：使用常量，编译期检查
let text = NSLocalizedString(kLoginButtonSubmit, comment: "")
```

**类型安全**：
- 常量名称在编译时会被检查，拼写错误会立即发现
- 硬编码字符串的错误只能在运行时发现
- IDE 可以提供代码自动补全和提示

**重构友好**：
- 修改 Key 值时，只需要在一处更新常量定义
- 使用搜索和替换功能可以快速更新所有引用
- 支持 IDE 的重命名重构功能

### 团队协作优化

**统一规范**：
- 所有开发人员使用相同的常量命名规则
- 避免每个人自己定义常量，造成命名混乱
- 新成员可以快速理解和使用现有常量

**文档化**：
- 常量名称本身就是一种文档
- 通过常量名称可以大致了解本地化内容的用途
- 减少查找 .strings 文件的需要

## 工作原理

### 规则配置

常量生成规则在 **偏好设置 > 常量** 中进行配置，提供丰富的定制选项：

**1. 前缀配置**
- 定义常量名称的前缀字符
- 常见选项：`k`、`K_`、`CONST_`、`STR_`等
- 也可以不使用前缀

**2. 命名风格**
- **驼峰命名（camelCase）**：首字母小写，后续单词首字母大写
  - 示例：`kLoginButtonSubmit`
- **帕斯卡命名（PascalCase）**：所有单词首字母大写
  - 示例：`KLoginButtonSubmit`
- **下划线命名（snake_case）**：全小写，单词间用下划线分隔
  - 示例：`k_login_button_submit`
- **大写下划线（UPPER_SNAKE_CASE）**：全大写，单词间用下划线分隔
  - 示例：`K_LOGIN_BUTTON_SUBMIT`

**3. 分隔符处理**
- 如何处理 Key 中的点号（`.`）、下划线（`_`）、连字符（`-`）等
- 可以选择保留、删除或转换为特定字符
- 定义单词边界的识别规则

**4. 路径处理**
- 是否保留完整的 Key 路径
- 是否过滤特定前缀（如 `com.company.app.` 只保留后续部分）
- 是否过滤特定后缀

**5. 特殊字符处理**
- 非法字符的替换或删除规则
- 数字开头的处理方式
- 保留字和关键字的处理策略

### 生成逻辑详解

以 Key 值 `com.app.login.button.submit` 为例，展示不同配置下的生成结果：

| 前缀 | 命名风格 | 路径处理 | 生成的常量名称 |
|-----|---------|---------|---------------|
| `k` | 驼峰命名 | 过滤 com.app | `kLoginButtonSubmit` |
| `K_` | 下划线命名 | 过滤 com.app | `K_login_button_submit` |
| `CONST_` | 大写下划线 | 过滤 com.app | `CONST_LOGIN_BUTTON_SUBMIT` |
| 无前缀 | 帕斯卡命名 | 过滤 com.app | `LoginButtonSubmit` |
| `k` | 驼峰命名 | 保留完整路径 | `kComAppLoginButtonSubmit` |
| `STR_` | 大写下划线 | 仅保留最后两段 | `STR_BUTTON_SUBMIT` |

**转换过程示例**：

原始 Key：`com.app.login.button.submit`

1. **路径过滤**：过滤前缀 `com.app.` → `login.button.submit`
2. **分隔符处理**：将 `.` 作为单词分隔符 → `[login, button, submit]`
3. **应用命名风格**：驼峰命名 → `[Login, Button, Submit]`
4. **添加前缀**：添加 `k` → `kLoginButtonSubmit`

### 自动更新机制

**实时生成选项**：
- 在"偏好设置 > 常量"中可以启用"自动生成常量"选项
- 创建新条目时，系统会自动根据 Key 值生成常量
- 修改 Key 值时，如果启用了自动更新，常量会自动重新生成

**手动生成控制**：
- 也可以关闭自动生成，仅在需要时手动触发
- 对于已有常量，可以选择是否覆盖更新
- 提供批量重新生成功能，用于更新所有条目的常量

**冲突处理**：
- 如果不同 Key 生成了相同的常量名，系统会提示警告
- 可以通过调整配置规则来避免冲突
- 或者为冲突的常量手动指定唯一名称

## 操作步骤

### 为单个条目生成常量

1. 在内容列表中选中需要生成常量的条目
2. 右键点击选中的条目
3. 选择"生成常量"菜单项
4. 系统会根据当前的规则配置自动生成常量
5. 生成的常量会立即显示在常量列中（如果常量列可见）
6. 条目会被标记为已修改状态

### 批量生成常量

1. 选中多个需要生成常量的条目（使用 `Command` 或 `Shift` 键多选）
2. 右键点击选中区域
3. 选择"生成常量"
4. 所有选中的条目都会按照相同规则生成常量

### 为所有条目生成常量

如果需要为整个文件或分组生成常量：

1. 使用 `Command + A` 全选所有条目
2. 右键选择"生成常量"
3. 批量生成完成后保存文件

### 重新生成常量

如果修改了常量生成规则，需要更新已有的常量：

1. 进入“脚本管理”，修改“常量生成”脚本
2. 返回内容列表，全选需要更新的条目
3. 执行"生成常量"操作
4. 旧的常量会被新规则生成的常量覆盖

## 使用场景

### 场景 1：项目初期设置常量规范

**背景**：
新项目开始，需要建立统一的常量命名规范。

**操作步骤**：
1. 在"偏好设置"中配置常量生成规则（如前缀 `k`，驼峰命名）
2. 创建本地化 Key 时，TransX 会自动生成对应的常量
3. 或在创建完所有 Key 后，全选并批量生成常量
4. 导出常量列表，生成常量定义文件（如 Swift 的 `Constants.swift`）

### 场景 2：代码中引用本地化字符串

**背景**：
开发人员需要在代码中使用本地化文本。

**操作步骤**：
1. 在 TransX 中找到需要的本地化条目
2. 查看常量列中的常量名称
3. 在代码中使用该常量：
```swift
// Swift 示例
let buttonTitle = NSLocalizedString(kLoginButtonSubmit, comment: "登录按钮")

// 或者使用扩展简化
extension String {
    static let loginButtonSubmit = NSLocalizedString(kLoginButtonSubmit, comment: "")
}
// 使用
button.setTitle(.loginButtonSubmit, for: .normal)
```

### 场景 3：常量文件自动化生成

**背景**：
项目较大，需要定期更新常量定义文件。

**工作流程**：
1. 在 TransX 中维护所有本地化 Key 和常量
2. 使用导出功能，导出包含常量的列表
3. 确保常量定义与 .strings 文件始终同步

**脚本示例**（Swift）：
```swift
// 自动生成的常量文件
// LocalizationConstants.swift

import Foundation

// MARK: - Login
let kLoginButtonSubmit = "com.app.login.button.submit"
let kLoginButtonCancel = "com.app.login.button.cancel"
let kLoginErrorMessage = "com.app.login.error.message"

// MARK: - Profile
let kProfileTitle = "com.app.profile.title"
let kProfileEditButton = "com.app.profile.button.edit"
```

### 场景 4：重构项目的常量命名

**背景**：
老项目的常量命名不规范，需要统一调整。

**操作步骤**：
1. 备份当前项目代码和 .strings 文件
2. 在“脚本管理”内调整“常量生成”脚本的实现
3. 在 TransX 中全选所有条目，重新生成常量
4. 导出新旧常量对照表
5. 测试验证功能正常
6. 提交代码更改

## 与代码集成

### Swift 项目集成

**常量定义文件**：
```swift
// LocalizationKeys.swift
struct LocalizationKeys {
    // 登录模块
    struct Login {
        static let buttonSubmit = "com.app.login.button.submit"
        static let buttonCancel = "com.app.login.button.cancel"
        static let errorInvalidEmail = "com.app.login.error.invalid_email"
    }
    
    // 首页模块
    struct Home {
        static let title = "com.app.home.title"
        static let tabProfile = "com.app.home.tab.profile"
    }
}
```

**使用示例**：
```swift
// 在 ViewController 中使用
let submitButton = UIButton()
submitButton.setTitle(LocalizationKeys.Login.buttonSubmit.localized, for: .normal)

// String 扩展
extension String {
    var localized: String {
        return NSLocalizedString(self, comment: "")
    }
}
```

### Objective-C 项目集成

**常量定义头文件**：
```objc
// LocalizationConstants.h
#ifndef LocalizationConstants_h
#define LocalizationConstants_h

// 登录模块
#define kLoginButtonSubmit @"com.app.login.button.submit"
#define kLoginButtonCancel @"com.app.login.button.cancel"

// 首页模块
#define kHomeTitle @"com.app.home.title"

#endif
```

**使用示例**：
```objc
// 在代码中使用
NSString *title = NSLocalizedString(kLoginButtonSubmit, @"登录按钮");
[button setTitle:title forState:UIControlStateNormal];
```

## 注意事项

1. **规则一致性**：项目中应统一使用一套常量生成规则，避免混乱
2. **命名冲突**：注意不同 Key 生成的常量可能会重复，需要在规则中考虑这种情况
3. **保留字符**：某些编程语言的保留字不能作为常量名，生成时需要特殊处理
4. **字符限制**：常量名称应该符合编程语言的标识符规范（如不能以数字开头）
5. **同步更新**：修改常量生成规则后，记得更新所有已有的常量
6. **代码引用**：如果代码中已经使用了常量，修改常量名称前要先更新代码引用
7. **版本控制**：常量定义文件应该纳入版本控制，与 .strings 文件同步提交
8. **文档说明**：在项目文档中说明常量的命名规则和使用方法
9. **多文件项目**：如果项目有多个 .strings 文件，注意不同文件间的常量不要冲突

## 最佳实践

1. **模块化组织**：按照应用模块组织常量，使用嵌套结构或前缀分组
2. **语义化命名**：常量名称应该清晰表达其用途，而不仅仅是 Key 的转换
3. **注释说明**：为常量添加注释，说明使用场景和注意事项
4. **定期审查**：定期审查常量命名是否合理，是否需要调整
5. **CI/CD 集成**：在持续集成中添加检查，确保常量定义与 .strings 文件一致
6. **类型安全封装**：使用枚举或结构体封装常量，利用编译器进行类型检查
7. **生成即使用**：创建新的本地化条目时立即生成常量，避免遗漏
8. **工具链支持**：配合 linter 和代码检查工具，禁止硬编码字符串
