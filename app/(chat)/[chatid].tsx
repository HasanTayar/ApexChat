import {
  SafeAreaView,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  View,
  Image,
  TextInput,
  ListRenderItem,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useNavigation } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useConvex, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { FlatList, TouchableOpacity } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
const Page = () => {
  const { chatid } = useLocalSearchParams();
  const [user, setUser] = useState<string | null>(null);
  const convex = useConvex();
  const navigation = useNavigation();
  const [newMessage, setNewMessage] = useState("");
  const listRef = useRef<FlatList>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const addMessage = useMutation(api.messages.sendMessage);
  const messages =
    useQuery(api.messages.get, { chatId: chatid as Id<"groups"> }) || [];
  useEffect(() => {
    const loadGroup = async () => {
      const groupInfo = await convex.query(api.group.getGroup, {
        id: chatid as Id<"groups">,
      });
      navigation.setOptions({ headerTitle: groupInfo?.name });
    };
    loadGroup();
  }, []);
  useEffect(() => {
    const loadUser = async () => {
      const user = await AsyncStorage.getItem("user");
      setUser(user);
    };
    loadUser();
  }, []);
  const handleSendMessage = async () => {
    Keyboard.dismiss();
    let messageSentSuccessfully = false;

    if (selectedImage) {
        setUploading(true);
        const url = `${process.env.EXPO_PUBLIC_CONVEX_SITE}/sendImage?user=${encodeURIComponent(user!)}&group_id=${chatid}&content=${encodeURIComponent(newMessage)}`;
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": blob.type! },
            body: blob,
        })
        .then(() => {
            setSelectedImage(null);
            setNewMessage("");
            messageSentSuccessfully = true;
        })
        .catch((e) => console.log(e))
        .finally(() => setUploading(false));
    } else {
        try {
            await addMessage({
                group_id: chatid as Id<"groups">,
                content: newMessage,
                user: user || "undefined",
            });
            messageSentSuccessfully = true;
        } catch (error) {
            console.log("Error sending message: ", error);
        }
        setSelectedImage(null);
        setNewMessage("");
    }

    if (messageSentSuccessfully) {
        notifyAllUsersInGroup();
    }
};

const notifyAllUsersInGroup = async () => {
  // Fetch all user IDs of a group using the new getUsers function
  const usersInGroup = await convex.query(api.group.getUsers, { groupId: chatid as Id<'groups'>});

  if (usersInGroup && usersInGroup.length) {
      for (const user of usersInGroup) {
          // Fetch the token of a user using the new getToken function
          const token = await convex.query(api.userTokens.getToken, { userId:user });

          if (token ) {
              const message = {
                  to: token,
                  sound: 'default',
                  title: 'New Message',
                  body: 'You have a new message in your chat.',
                  data: { chatId: chatid },
              };

              // Sending push notification
              await fetch('https://exp.host/--/api/v2/push/send', {
                  method: 'POST',
                  headers: {
                      Accept: 'application/json',
                      'Accept-encoding': 'gzip, deflate',
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(message),
              });
          }
      }
  }
};

  useEffect(() => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 300);
  }, [messages]);
  const renderMessages: ListRenderItem<Doc<"messages">> = ({ item }) => {
    const isUserMessage = item.user === user;
    return (
      <View
        style={[
          styles.messageContainer,
          isUserMessage
            ? styles.userMessageContainer
            : styles.otherMessageContainer,
        ]}
      >
        {item.content !== "" && (
          <Text
            style={[
              styles.messageText,
              isUserMessage ? styles.userMessageText : null,
            ]}
          >
            {item.content}
          </Text>
        )}
        {item.file && <Image source={{uri: item.file}} style={{width:200 , height:200 ,margin:10}}/>}
        <Text style={styles.timestamp}>
          {new Date(item._creationTime).toLocaleTimeString()} - {item.user}
        </Text>
      </View>
    );
  };
  const captureImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
      >
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderMessages}
          keyExtractor={(item) => item._id.toString()}
          ListFooterComponent={<View style={{ padding: 10 }} />}
        />
        <View style={styles.inputContainer}>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={{ width: 200, height: 200, margin: 10 }}
            />
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Enter Your Message ..."
              multiline={true}
            />
            <TouchableOpacity style={styles.button} onPress={captureImage}>
              <Ionicons name="add-outline" style={styles.sendButton} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={handleSendMessage}
              disabled={newMessage === ""}
            >
              <Ionicons name="send-outline" style={styles.sendButton} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      {uploading && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "rgba(0,0,0,0.4)",
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <ActivityIndicator color="#fff" animating size="large" />
        </View>
      )}
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F5F2",
  },
  container: {
    flex: 1,
    backgroundColor: "#FAF7F0",
    justifyContent: "flex-end",
  },
  inputContainer: {
    paddingHorizontal: 15,
    borderTopWidth: 1.5,
    borderTopColor: "#ccc",
    backgroundColor: "#fff",
    elevation: 3,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#ccc",
    borderRadius: 30,
    paddingHorizontal: 20,
    minHeight: 50,
    marginRight: 15,
    backgroundColor: "#F8F5F2",
    color: "black",
    fontSize: 17,
  },
  button: {
    width: 55,
    height: 55,
    backgroundColor: "#ED9F1C",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  sendButton: {
    fontSize: 26,
    color: "#fff",
  },
  messageContainer: {
    padding: 12,
    borderRadius: 12,
    margin: 12,
    maxWidth: "80%",
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  userMessageContainer: {
    backgroundColor: "#7B146C",
    alignSelf: "flex-end",
  },
  otherMessageContainer: {
    alignSelf: "flex-start",
    backgroundColor: "#FDFDFD",
  },
  messageText: {
    fontSize: 17,
  },
  userMessageText: {
    color: "#FDFDFD",
  },
  timestamp: {
    fontSize: 13,
    color: "#b7b7b7",
  },
});

export default Page;
