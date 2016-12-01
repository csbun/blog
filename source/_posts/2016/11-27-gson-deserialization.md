title: Java 中使用 Gson 反序列化 JSON 数据
banner: gallery/taiwan/DSC03959.JPG
date: 2016-11-27 18:52:14
tags:
- Java
- JSON
- serialization
- deserialization
---

好长时间没写 Java，发现序列化、反序列化一个 JSON 数据真不是个容易的事情（主要还是年纪大了，记不住）。于是记录一下使用 [Gson](https://github.com/google/gson) 反序列化的方法。

> 作者本身不懂 Java，本着不负责的态度写下这些内容，大牛勿喷，想抄代码的菜鸟请珍重。
> 本文基于转换期间没有异常情况讨论，实际情况请珍重。

## 初始化

我们先创建一个简单的 _TestMain.java_ 文件，用来运行我们后续的测试方法。

```java TestMain.java
public class TestMain {
  public static void main(String args[]){
    // 运行测试方法
  }
}
```

<!-- more -->

通过 `javac TestMain.java` 会生成 _TestMain.class_ 文件，之后就能通过 `java TestMain` 运行 _class_ 文件。

在当前的例子中我们 google 的 [Gson](https://github.com/google/gson)( [maven 地址](http://search.maven.org/#artifactdetails%7Ccom.google.code.gson%7Cgson%7C2.8.0%7C)) 库来做序列化和反序列化。简单起见，我们直接下载 jar 包，放到 _lib_ 目录下。

> 因为我们使用了 gson.jar 所以命令会变成这样：
> `javac -classpath lib/gson-2.8.0.jar TestMain.java`
> `java -classpath .:lib/gson-2.8.0.jar TestMain`


## JsonParser

### Object

假设我们有这样一个简单的 JSON 数据：

```json
/* Sample JSON */
{
  "name": "Hans Chan",
  "age": 18,
  "tags": [{
    "id": 1,
    "text": "JavaScript"
  }, {
    "id": 2,
    "text": "Java"
  }]
}
```

使用 `JsonParser` 足够的简单：

```java
JsonParser jsonParser = new JsonParser();
JsonElement userJsonElement = jsonParser.parse(json);
```

所有东西都是 **抽象** 的 `JsonElement`([api](https://static.javadoc.io/com.google.code.gson/gson/2.6.2/com/google/gson/JsonElement.html))，如果要获取具体的内容，就得转换成 `JsonObject` 或 `JsonArray` 等类型，获取方式也非常直观 `.get("key")`：

```java
JsonObject userJsonObject = userJsonElement.getAsJsonObject();
String name = userJsonObject.get("name").getAsString();
int age = userJsonObject.get("age").getAsInt();
JsonArray userTagsJsonArray = userJsonObject.get("tags").getAsJsonArray();
```

### Array

同样的场景，如果输入的 `json` 字符串不是 `{}` 而是 `[]`，也可以通过上述方法获取：

```java
String json = "[{},{}]"; // 每个 {} 都是一个 Sample JSON
JsonArray userJsonArray = jsonParser.parse(json).getAsJsonArray(); // 不是 getAsJsonObject
for (int i = 0; i < userJsonArray.size(); i++) {
    JsonObject userJsonObject = userJsonArray.get(i).getAsJsonObject();
    // ...
}
```

### Serialization

`JsonElement` 的序列化很简单，直接 `.toString()` 即可。

```java
String json = userJsonObject.toString(); // JsonObject
```

## OO

这下子，写 Java 的哥们就肯定会跳出来说 “这是什么鬼，一点都不 OO”。的确上面的方式很 js，于是我们就要写得像 Java 一点，先来两个 class ：

```java
private class Tag {
    private int id;
    private String text;
    // 此处省略 Getter and Setter
}
private class User {
    private String name;
    private int age;
    private List<Tag> tags;
    // 此处省略 Getter and Setter
}
```

### Object

大家注意了，我要变形了！（敲黑板）

```java
Gson gson = new Gson();
User user = gson.fromJson(json, User.class);
```

通过 Gson，`String` 被转换成指定的 `User.class`，然后我们就可以愉快地操作这个实例了：

```java
List<Tag> tags = user.getTags();
for (int i = 0; i < tags.size(); i++) {
    Tag tag = tags.get(i);
    System.out.println("tag " + tag.getId() + ": " + tag.getText());
}
```

### Array

还是同样的例子，如果是 `[]` 怎么办？我们当然期望是获得一个 `List<User>` 啦，但没有 `List<User>.class` 这个东西，怎么破？没关系，Gson 里面还有个 `TypeToken` 是可以跟你干这事的，我们只需要这样：

```java
// import com.google.common.reflect.TypeToken;
TypeToken typeToken = new TypeToken<List<User>>() {};
// import java.lang.reflect.Type;
Type type = typeToken.getType();

List<User> users = gson.fromJson(json, type);
```

还是可以愉快地玩耍的，不是麽 😂

### Serialization

Class 要反序列化就还是要依赖回 Gson 提供的 `toJson` 方法：

```java
String json = gson.toJson(user); // User
```

## GsonBuilder

很多时候，输入的 json 总有那么一点不尽人意，例如下面这个例子：

```json
{
  "id": 3,
  "name": "Hans Chan",
  "registrationTime": "1999-09-19 18:10:22",
  "data": {
    "some": "complex data",
    "we": {
      "do-NOT": ["care", "about", "what", "inside"],
      "BUT": "needed!"
    }
  }
}
```

- `id` 是我们需要的数据，但序列化出去的时候不想显示
- `registrationTime` 可能不是一个我们想要的格式
- `data` 可能是我们不是很关心结构，但又需要保存里面的内容

利用 GsonBuilder 和 Annotation 我们就可以实现上面两个功能：

```java
private class BaseUser {
    // import com.google.gson.annotations.Expose;
    @Expose(serialize = false, deserialize = true)
    private int id;

    @Expose
    private String name;

    // import com.google.gson.annotations.SerializedName;
    @SerializedName("registrationTime")
    @Expose
    private Date registration;

    public int getId() {
        return id;
    }
    public Date getRegistration() {
        return registration;
    }
}
private class CustomBUser extends BaseUser {
    @Expose
    private JsonElement data;

    public JsonElement getData() {
        return data;
    }
}
```

`registrationTime` 的格式我们用 `GsonBuilder` 声明：

```java
Gson deserializationGson = new GsonBuilder()
        // 不导出实体中没有用 @Expose 注解的属性
        .excludeFieldsWithoutExposeAnnotation()
        // 时间格式
        .setDateFormat("yyyy-MM-dd HH:mm:ss")
        .create();
```

愉快地玩耍吧：

```java
CustomBUser cbu = deserializationGson.fromJson(json, CustomBUser.class);
System.out.println("id: " + cbu.getId());
System.out.println(cau.getData());
```

### 自定义序列化和反序列化

上面的例子中，`data` 是直接用一个 `JsonElement` 来处理的，如果有更加个性化的要求，那就需要自己写序列化和反序列化方法了。这里我们自己实现一个 `CustomUserData` 类，用来处理 `data` 数据，直接实现上面相同的功能：

```java
private static class CustomUserData {
    private JsonElement ctx;
    public CustomUserData(JsonElement ctx) {
        this.ctx = ctx;
    }
    public String toString() {
        return this.ctx.toString();
    }
}
private class CustomAUser extends BaseUser {
    @Expose
    private CustomUserData data;

    public CustomUserData getData() {
        return data;
    }
}
// 自定义反序列化方法
private static class CustomUserDataDeserializeAdapter implements JsonDeserializer<CustomUserData> {
    @Override
    public CustomUserData deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context)
            throws JsonParseException {
        // 这里实现复杂的功能
        return new CustomUserData(json);
    }
}
// 自定义序列化方法
public static class CustomUserDataSerializeAdapter implements JsonSerializer<CustomUserData> {
    @Override
    public JsonElement serialize(CustomUserData src, Type typeOfSrc, JsonSerializationContext context) {
        // 这里实现复杂的功能
        return src.ctx;
    }
}
```

通过 `registerTypeAdapter` 给 GsonBuilder 注册上面的自定义序列化方法：

```java
Gson deserializationGson = new GsonBuilder()
        .excludeFieldsWithoutExposeAnnotation()
        .setDateFormat("yyyy-MM-dd HH:mm:ss")
        .registerTypeAdapter(CustomUserData.class, new CustomUserDataDeserializeAdapter())
        .create();
Gson serializationGson = new GsonBuilder()
        .excludeFieldsWithoutExposeAnnotation()
        .setDateFormat("yyyy/MM/dd HH:mm:ss")
        .registerTypeAdapter(CustomUserData.class, new CustomUserDataSerializeAdapter())
        .setPrettyPrinting()
        .create();

System.out.println("---------- CustomAUser ----------");
CustomAUser cau = deserializationGson.fromJson(json, CustomAUser.class);
System.out.println("id: " + cau.getId());
// System.out.println(cau.getRegistration());
// System.out.println(cau.getData()); // .toString()
System.out.println(serializationGson.toJson(cau));
```
