## [1.3.1](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.3.0...v1.3.1) (2025-01-03)

### 🐛 Bug Fixes

* edge-case window not defined on SSR error ([2b8eb6e](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/2b8eb6e4d4a5b8648689b41cfe6e2df2fb076033))
* remove fallback type for key in PersistOptions ([5792d86](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/5792d8602ef49ef10d2de145a766444d73f92e0b))

## [1.3.0](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.2.3...v1.3.0) (2025-01-03)

### 🚀 Features

* support object keys for state persistence ([f70f2ed](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/f70f2ed352ac2c7a3169d0b09650f0c877936e4a))

## [1.2.3](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.2.2...v1.2.3) (2025-01-02)

### 🐛 Bug Fixes

* re-add types to package.json and update Vitepress config ([d436421](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/d4364217f84c5464967f3307a4f69f174709c3d0))

## [1.2.2](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.2.1...v1.2.2) (2025-01-02)

### 🐛 Bug Fixes

* **release:** ensure package.json version is updated during release ([0345d19](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/0345d19ad6fbc7ba7b25c0b76e5dff841795083e))

## [1.2.1](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.2.0...v1.2.1) (2025-01-02)

### 🐛 Bug Fixes

* re-add main field for compatibility with legacy tools ([ffabb3e](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/ffabb3e6b2caaf87a67f72c91a415bb4df7f52f7))

## [1.2.0](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.1.1...v1.2.0) (2025-01-02)

### 🚀 Features

* add support for CommonJS module format ([8259353](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/8259353b9fd3425fe4357a026e2c27c21c82e01a))
* skip localforage on SSR by default ([f989de6](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/f989de603034b56bebb9d3753588f3ec41b6ee78))
* **ts:** enable strict mode and fix related type errors ([23d2ae9](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/23d2ae9a234a99947560d74ef61e3302c25b7dfd))

### 📚 Documentation

* add advanced use cases documentation ([1713fb2](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/1713fb232a2a337cf4a4a6f7673a35dbc95ec8fa))
* improve clientOnly examples and clarify comments ([938bac3](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/938bac3cafdbc6fa8858719b38f51efe6b1d6e9a))

## [1.1.1](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.1.0...v1.1.1) (2025-01-01)

### 🐛 Bug Fixes

* **tsconfig:** resolve ESM import errors by setting module to NodeNext ([b9ddc61](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/b9ddc615b3da6e24acc8c0909ad9a0eb9079662e))

### 📦 Chores

* updated .gitignore and removed unnecessary files ([4b710a3](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/4b710a327d78ae5b3720b8923a97db73c6b8c23f))

## [1.1.0](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.0.1...v1.1.0) (2025-01-01)

### 🚀 Features

* add clientOnly option ([8297d90](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/8297d9044b4e127f0429b81a24f672134d9d88bb))

### 🐛 Bug Fixes

* ensure synchronous store initialization to avoid race conditions ([0a0b900](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/0a0b9007062c5a0e944a95cc46ae7f689c4ee787))

### 📦 Chores

* add VitePress docs and deploy script ([1abefd5](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/1abefd52f26b9662686909aebc172d4eb83742a7))

### 📚 Documentation

* improve themes, enhance syntax highlighting, and clarify content ([2a6c580](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/2a6c5803f14b4c38309e3d11e210684ba5f5c25c))
* **readme:** add project logo for better branding ([2ffc94f](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/2ffc94f803ac7f9324a2d177a0117a5a04f01259))
* update README and example usage ([d829f33](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/d829f338c2c5b4da3b9c8caab697f48c55e86a95))
* updated README.md ([44ea7f8](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/44ea7f85b173f2644bc6841e2e9376223ab0944e))

## [1.0.1](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.0.0...v1.0.1) (2024-12-28)

### 🐛 Bug Fixes

* asyncStorage type ([8acbac2](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/8acbac292d203f43eb64770863799f8eec922681))
* gracefully handle invalid JSON during state merge ([33a5b92](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/33a5b928da7e0283b6b553520718ffa3d2b51676))

### 📚 Documentation

* updated README.md ([192f921](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/192f9216bb283020fde6dfbd9a96f507d8d0e641))

### 🛠️ Refactoring

* **utils:** move reusable functions to utils and rename for clarity ([40851bc](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/40851bc48ad9e1bf326132c54215ea6a60f06686))

## 1.0.0 (2024-12-27)

### 🚀 Features

* add core implementation for pinia state persistence plugin ([2d6e5c8](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/2d6e5c840595339317c13b06d9c014c0a5f31af5))

### 📦 Chores

* add initial project configuration files ([f149623](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/f1496231ff6bc03362bc96cb262db3257525552e))

### 📚 Documentation

* add initial README for Pinia Plugin - State Persistence ([c7441fd](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/c7441fd64904a355c3c112d4b21c6f4ae61a15f1))
