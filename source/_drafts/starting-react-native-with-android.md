title: 在 Android 上开始使用 React Native
tags:
- Android
- React
- Native
---

以下内容大部分都是 [React Native](http://facebook.github.io/react-native/) 官网中 [Getting Started](http://facebook.github.io/react-native/docs/getting-started.html) 和 [Android Setup](http://facebook.github.io/react-native/docs/android-setup.html) 的内容。当然也记录了我在这个过程中遇到的一些问题。

<!-- more -->

## 准备环境

Mac 用户在已经有 [Homebrew](http://brew.sh/) 和 [Node 4.x](https://nodejs.org/) 的情况下，以下都比较简单：

```sh
npm install -g react-native-cli
brew install watchman
brew install flow
```

如果已经安装过，就运行下面命令更新一下：

```sh
brew update
brew upgrade
```

附 [Linux and Windows Support](http://facebook.github.io/react-native/docs/linux-windows-support.html)。

## 先跑个 IOS 的起来试试

```
react-native init AwesomeProject
cd AwesomeProject
```

在 Xcode 中打开 `ios/AwesomeProject.xcodeproj`（或直接运行这个文件），点击左上角的 `▶` 即会打开 Xcode 自带的 Simulator，非常方便。

在 Simulator 中使用快捷键 `cmd-d` 打开开发菜单，选择 `Enable Live Relaod`。然后修改 `index.ios.js`：

```javascript
// ...
var {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  SwitchIOS, // add
} = React;

var AwesomeProject = React.createClass({
  render: function() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Welcome to React-Native!
        </Text>
        <Text style={styles.instructions}>
          To get started, edit index.ios.js
        </Text>
        <Text style={styles.instructions}>
          Press Cmd+R to reload,{'\n'}
          Cmd+D or shake for dev menu
        </Text>
        {/* add */}
        <SwitchIOS />
      </View>
    );
  }
});
```

就能看到 App 的文字底部增加了一个 Switch 按钮。更多的接口可以看 [SwitchIOS](http://facebook.github.io/react-native/docs/switchios.html)，当然还有更多的 COMPONENTS 可以使用，这里不再深究。

## 安装 Android 环境

安装 [JDK](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html) 的文章一大堆，就不说了。brew 真是个好东西，安装 [Android SDK](https://developer.android.com/sdk/installing/index.html) 和 [Gradle](https://docs.gradle.org/current/userguide/installation.html) 也很简单：

```sh
brew install android-sdk
brew install gradle
```

但是添加环境变量这个还是要做的：

```
# brew 安装的 android-sdk，我当前的版本是 24.4.1
export ANDROID_HOME=/usr/local/Cellar/android-sdk/24.4.1_1
# brew 安装的 gradle，我当前的版本是 2.9
export GRADLE_HOME=/usr/local/Cellar/gradle/2.9/bin
```

### 下载工具

在命令行中运行 `android` 即可打开 Android SDK Manager，按照 [这里的说明](http://facebook.github.io/react-native/docs/android-setup.html#configure-your-sdk) 安装：

- Android SDK Build-tools version __23.0.1__
- Android 6.0 (API 23)
- Android Support Repository

注意，Build-tools 必须是 __23.0.1__，我就是没看清楚选了 24.x 后面一直报错：

```
Build-tools version 23.0.1
```

当然后续 react-native-cli 升级可能会更新 Build-tools，反正如果看到这个错误，就安装对应的 Build-tools 就好啦。

### 虚拟机

因为之前开发需要，我已经安装了 [Genymotion](https://www.genymotion.com/)，就直接使用了。但是官网也提供了 [Google emulator](http://facebook.github.io/react-native/docs/android-setup.html#alternative-create-a-stock-google-emulator) 的启动方法，也不麻烦。


## 再跑个 Android 虚拟机的试试

### 设备

在 Genymotion 创建并启动一个 device，在命令行运行：

```
adb devices
```

就能看到类似的结果：

```
List of devices attached
192.168.56.101:5555 device
```

第一列表示设备 ID，第二列表示设备状态，`device` 表明可以运行。

### 启动

命令行运行

```
react-native run-android
```

等等就能在虚拟机中看到启动了和刚刚 IOS 中一样的应用，点击 Genymotion player 右侧的菜单按钮，同样能打开开发菜单。


## USB 真实设备

// TODO

```
adb reverse tcp:8081 tcp:8081
```
