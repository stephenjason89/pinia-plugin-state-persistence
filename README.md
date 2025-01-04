<div align="center" style="filter: drop-shadow(-1px -1px 0px rgba(0, 0, 0, 0.3));">
  <img src="docs/public/logo.png" alt="Project Logo" width="300">
</div>
<p align="center" style="margin-top: 25px">
 Persist Pinia States Anywhere, Effortlessly
</p>
<p align="center">
  <a href="https://npmjs.com/package/pinia-plugin-state-persistence"><img src="https://img.shields.io/npm/v/pinia-plugin-state-persistence?style=flat-square&labelColor=FFD700&color=FFA500" alt="npm"></a>
  <a href="https://bundlephobia.com/result?p=pinia-plugin-state-persistence"><img src="https://img.shields.io/bundlephobia/minzip/pinia-plugin-state-persistence?style=flat-square&labelColor=32CD32&color=FFA500" alt="minizipped size"></a>
  <a href="https://github.com/stephenjason89/pinia-plugin-state-persistence/blob/main/LICENSE"><img src="https://img.shields.io/github/license/stephenjason89/pinia-plugin-state-persistence?style=flat-square&labelColor=FFD700&color=32CD32" alt="license"></a>
</p>
<p align="center">
  <a href="https://stephenjason89.github.io/pinia-plugin-state-persistence"><b>Documentation</b></a>
</p>

## Overview

This project is a Pinia plugin designed to provide state persistence capabilities for Vue applications. It enables developers to persist store states across sessions using various storage options, including synchronous and asynchronous storage mechanisms. The plugin is configurable and supports advanced features like filtering mutations and custom serialization/deserialization.

## Features

- **Universal Storage Support**: Works with both synchronous and asynchronous storage mechanisms, including `localStorage`, `cookies`, and libraries like `localForage` or even custom `remote APIs`.
- **Customizable Persistence**: Configure key names, mutation filters, and serialization/deserialization methods.
- **Debugging Support**: Includes a built-in logger to track plugin operations.
- **State Overwriting**: Optionally overwrite the store state during initialization.
- **SSR Compatibility**: Fully supports server-side rendering environments, addressing edge cases with seamless state handling.

## Why Choose This Plugin?

- **Zero Dependencies**: This plugin is lightweight and has no external dependencies (other than Pinia itself), ensuring minimal impact on your application's bundle size.
- **Compact Size**: The bundle's minified gzip size is only **1 kB**, making it highly efficient for production use.
- **Async Storage Support**: Unlike other plugins, this plugin natively supports asynchronous storage mechanisms such as `localForage`, making it ideal for modern applications.
- **Queueing Mechanism**: Introduces a queueing mechanism to eliminate race condition issues during state persistence.
- **Enhanced Flexibility**: Offers advanced configuration options, including custom merge strategies, state filters, and serialization methods, ensuring it adapts to diverse use cases.
- **Reliable State Management**: Resolves common issues with state persistence in both client-side and SSR setups, providing a smoother developer experience.
- **Developer-Centric Approach**: Built with contributions and feedback in mind, ensuring issues are addressed promptly and features align with real-world needs.

## Quick Links

- [Installation Guide](https://stephenjason89.github.io/pinia-plugin-state-persistence/guide/installation)
- [API Reference](https://stephenjason89.github.io/pinia-plugin-state-persistence/api)
- [Examples](https://stephenjason89.github.io/pinia-plugin-state-persistence/guide/example-store)

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Contact

For questions or support, please open an issue or start a discussion on [GitHub](https://github.com/stephenjason89/pinia-plugin-state-persistence/issues).
