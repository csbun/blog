title: 在 Android 上开始使用 React Native
banner: gallery/TODO.jpg
tags:
  - Android
  - React
  - Native
date: 2015-12-11 16:02:27
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

```sh
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

```sh
react-native run-android
```

等等就能在虚拟机中看到启动了和刚刚 IOS 中一样的应用，点击 Genymotion player 右侧的菜单按钮，同样能打开开发菜单。


## USB 调试真实设备

手机开启 __USB 调试__ 之后，用 USB 链接电脑，再次运行 `adb devices` 一般情况下就能看到类似：

```
List of devices attached
14ed2fcc device
```

说明你的设备已经链接上了，然而我手上的魅族却怎么也不出来。查一下 [资料](http://bbs.flyme.cn/thread-18159-1-1.html) 很快就找到解决方案：

```sh
echo 0x2a45 > .android/adb_usb.ini
```

另外官网声明：

> You must have __only one device connected__.

有且只能有一个设备链接，这时候再运行 `react-native run-android` 理论上应该就能和虚拟机一样跑起来了吧。然而真是图样图森破，Building 到 97% 又爆一个问题：

```
app:installDebug
Installing APK 'app-debug.apk' on 'm2 - 5.1'
03:44:04 E/2099056020: Error while uploading app-debug.apk : Unknown failure
Unable to install /path/to/AwesomeProject/android/app/build/outputs/apk/app-debug.apk
com.android.ddmlib.InstallException: Unable to upload some APKs
  at com.android.ddmlib.Device.installPackages(Device.java:920)
  ...
:app:installDebug FAILED

FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':app:installDebug'.
> com.android.builder.testing.api.DeviceException: com.android.ddmlib.InstallException: Unable to upload some APKs
...
```

[React Native 真是被各路国产机坑坏了](https://github.com/facebook/react-native/issues/2720)，还好 [有人给出了解决方案](https://github.com/facebook/react-native/issues/2720#issuecomment-153648404)：将 `android/build.gradle` 第 8 行的版本号改成 `1.2.3` 即可

```
// Top-level build file where you can add configuration options common to all sub-projects/modules.

buildscript {
    repositories {
        jcenter()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:1.2.3'

        // NOTE: Do not place your application dependencies here; they belong
        // in the individual module build.gradle files
    }
}
```

再来一次，App 跳出来了！然而，然而是红色的错误界面吖，无论怎么 RELOAD JS 都提示 `Unable to download JS bundle`。还好 [不是只有我一个遇到这个问题](https://github.com/facebook/react-native/issues/3130)，按照 [jinmatt 的方法](https://github.com/facebook/react-native/issues/3130#issuecomment-145235797) 试一下：

```sh
adb reverse tcp:8081 tcp:8081
react-native run-android
```

这回真的好了！大幅度摇一摇手机，调出开发者菜单，我喜欢 `Enable Live Relaod`，然后就来改改 `index.android.js`：

```js
var {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  SwitchAndroid, // add
} = React;

var PointsMall = React.createClass({
  render: function() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Welcome to React-Native!
        </Text>
        <Text style={styles.instructions}>
          To get started, edit index.android.js
        </Text>
        <Text style={styles.instructions}>
          Shake or press menu button for dev menu
        </Text>
        {/* add */}
        <SwitchAndroid />
      </View>
    );
  }
});
```

这回 App 的文字底部增加了一个 Android 的 Switch 按钮。
