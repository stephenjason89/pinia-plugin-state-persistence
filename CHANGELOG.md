## [1.10.2](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.10.1...v1.10.2) (2025-04-23)

### 🐛 Bug Fixes

* remove unnecessary debug message ([7626322](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/762632290e9acb4ffa7cff200bf5b19dda9ba014))

### 📦 Chores

* **lockfile:** migrate from bun.lockb to text-based bun.lock ([62b789d](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/62b789d5cb99b78ac7f0e4b93252dc0e42d3d4b5))

## [1.10.1](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.10.0...v1.10.1) (2025-02-20)

### 🐛 Bug Fixes

* support pinia@3 ([b69d396](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/b69d396ec65f31f73ebf44c7075f0d966fe257cf))

## [1.10.0](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.9.0...v1.10.0) (2025-01-21)

### 🚀 Features

* improve debug messages and add per-store debugging support ([62e8799](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/62e879949660a675a5e28ee24d46cc5827943d2b))

### 📚 Documentation

* update persist-options to include debug option ([783088f](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/783088f997609547900a2b9e636c47fb9aabf6b2))

## [1.9.0](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.8.2...v1.9.0) (2025-01-21)

### 🚀 Features

* **persistence:** add support for multiple storages ([#15](https://github.com/stephenjason89/pinia-plugin-state-persistence/issues/15)) ([ebd6423](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/ebd64230abb494e27f30151916fc24e6ef565ef8))

### 📚 Documentation

* update nuxt-integration plugin example ([9617760](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/96177600e65d6006a95cad9c46b9ee919593077f))

## [1.8.2](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.8.1...v1.8.2) (2025-01-15)

### 🐛 Bug Fixes

* **types:** move debug option to globalOptions only and omit include/exclude ([3a147bf](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/3a147bfeea89d39fdeaa1092b6be567d76e4c00e))

### 📚 Documentation

* **storeOptions:** remove references to the debug option ([53e5251](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/53e5251e6aaac15f38251a83754436edaba0d225))

### 💄 Code Style

* replace pluginOptions with globalOptions for consistency with docs ([aa94463](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/aa944638c7aeb7beed3ad8a5db8f0e2695ddeaef))

## [1.8.1](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.8.0...v1.8.1) (2025-01-15)

### 🐛 Bug Fixes

* **logging:** prevent circular reference error in persistence logs ([e6b64b7](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/e6b64b75c6704f392640be7a8cd3ee938944370b))

## [1.8.0](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.7.2...v1.8.0) (2025-01-15)

### 🚀 Features

* **logging:** added context-aware log messages for clearer debugging information ([f3af766](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/f3af7660c9d129e24f09e508ea790e40948e24e3))

### 🐛 Bug Fixes

* correct types for $persist and $restore methods ([153e234](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/153e234f51aae0607371de9e184cc737658101cf))

## [1.7.2](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.7.1...v1.7.2) (2025-01-14)

### 🐛 Bug Fixes

* mark package as side-effect-free for tree-shaking ([470de10](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/470de10c5378f050c542de2d29e72c9257e3f9e1))

## [1.7.1](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.7.0...v1.7.1) (2025-01-14)

### 🐛 Bug Fixes

* ensure package is tree-shakable and compatible with modern tools ([3f8d523](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/3f8d52306776bde388d4520611280bc8ceb1be95))

### 📚 Documentation

* added drop-shadow effect to the logo for enhanced visual appeal ([67c6fc9](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/67c6fc9d8672ab04dfd391adc09a53068017eb7d))

## [1.7.0](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.6.0...v1.7.0) (2025-01-13)

### 🚀 Features

* add support for deep-copied object storage with deepCopy option ([#11](https://github.com/stephenjason89/pinia-plugin-state-persistence/issues/11)) ([7a61b23](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/7a61b23c2d43dc124c6a0113c69394604006be55))

### 💄 Code Style

* rename restoringState to isRestoringState for improved readability and consistency ([c654e83](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/c654e83267364a517ce8dfbe82afee1054a96711))

## [1.6.0](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.5.3...v1.6.0) (2025-01-13)

### 🚀 Features

* improve code readability, enhance state restoration logic & prevent redundant state persistence during restoration ([#9](https://github.com/stephenjason89/pinia-plugin-state-persistence/issues/9)) ([39a8640](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/39a86404078c2219b90ab0ec3b7bdc2793bd0dfb))

## [1.5.3](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.5.2...v1.5.3) (2025-01-12)

### ⚡ Performance

* improved state persistence logic by preventing redundant saves when the state hasn't changed ([#7](https://github.com/stephenjason89/pinia-plugin-state-persistence/issues/7)) ([620afad](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/620afad39806e7277c03d92c0b80b2735e3df680))

## [1.5.2](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.5.1...v1.5.2) (2025-01-11)

### 🐛 Bug Fixes

* apply overwrite logic to object key persistence ([#4](https://github.com/stephenjason89/pinia-plugin-state-persistence/issues/4)) ([cc62594](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/cc625949b771f014baebb33e8320a60ae2cd6da7))

## [1.5.1](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.5.0...v1.5.1) (2025-01-09)

### ⚡ Performance

* streamline loadState and persistState by eliminating redundant async handling ([#3](https://github.com/stephenjason89/pinia-plugin-state-persistence/issues/3)) ([b3207df](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/b3207df65ad4c472a77e26c4bac33d9e60772eca))

### 📦 Chores

* add issue and PR templates ([cf5f836](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/cf5f836c4017b229282fdf5f11ff2a4c0952926a))
* create FUNDING.yml ([6fd1bfc](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/6fd1bfcff85756ed7d44fded50a7a2c5238670fe))

## [1.5.0](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.4.0...v1.5.0) (2025-01-06)

### 🚀 Features

* make $restore and $persist awaitable with improved async handling ([d47ff46](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/d47ff4644f8628973b837a7cf11b8ab939575691))

### 📚 Documentation

* add edit link and last updated metadata to VitePress ([fb14d1a](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/fb14d1a5dd7a0fac6234efa2627a4e892d10ff81))

## [1.4.0](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.3.2...v1.4.0) (2025-01-04)

### 🚀 Features

* add support for key prefix in global options ([888d429](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/888d429f2fb97bfad3f94022940afcee0daaf28f))

### 📚 Documentation

* add minimal usage example to installation.md ([b4a6a24](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/b4a6a24db07936d8f5f87d091d4e21f5c67bdc87))
* enhance storage examples and overwrite behavior explanation ([3a476ef](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/3a476ef87f7d36858caf20abc7f1a029c0b54fd5))
* improved usage examples and reorganize configuration sections ([55028b4](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/55028b453d35b3a8ad5e8a4b75126a3e114fb14e))
* make custom storage implementation collapsible in Features.md ([ba2d3ac](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/ba2d3ac3374842db3e32d4a52a4845a93b48e744))
* move example stores to example-store.md and enhance content ([c6c30c6](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/c6c30c622d3d382b96f46447c68f9753bbe87d79))
* streamline api documentation ([58453eb](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/58453ebb6080dd9ad1678e9f7633e49c9ce3cae4))
* streamline README to point to documentation site ([c4388b3](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/c4388b3534bfef2a1bc52c7e91ffe4e20200824c))

## [1.3.2](https://github.com/stephenjason89/pinia-plugin-state-persistence/compare/v1.3.1...v1.3.2) (2025-01-03)

### 🐛 Bug Fixes

* restore type fallback for key property in state persistence ([47d1a5f](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/47d1a5fe86f2fc80c65f369be2f6c8031cda2dfa))

### 📚 Documentation

* introduce advanced usage in README and object key persistence in documentation ([5796030](https://github.com/stephenjason89/pinia-plugin-state-persistence/commit/5796030ad5777079dddea66155478a84e6db30cb))

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
