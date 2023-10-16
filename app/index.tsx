import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform
} from "react-native";
import React, { useEffect, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { ScrollView } from "react-native-gesture-handler";
import { Link } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Dialog from "react-native-dialog";
import * as Notifications from 'expo-notifications';

const Page = () => {
  const groups = useQuery(api.group.get) || [];
  const [name, setName] = useState("");
  const [visible, setVisible] = useState(false);
  const [gretting, setGretting] = useState('');
  const performGreetingAction = useAction(api.greetings.getGreeting);
  const saveUserToken=useMutation(api.userTokens.saveUserToken);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  useEffect(() => {
    const saveToken = async () => {
        if (hasNotificationPermission) {
            const token = await Notifications.getExpoPushTokenAsync();
            await AsyncStorage.setItem("expoPushToken", token.data);
        }
    };
    saveToken();
}, [hasNotificationPermission]);

  useEffect(() => {
    const getNotificationPermission = async () => {
      if (Platform.OS === 'ios') {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          alert('Failed to get push token for push notification!');
          return;
        }
        setHasNotificationPermission(true);
      } else if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
        setHasNotificationPermission(true);
      }
    };

    getNotificationPermission();
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const user = await AsyncStorage.getItem("user");
      if (!user) {
        setTimeout(() => {
          setVisible(true);
        }, 100);
      } else {
        setName(user);
      }
    };
    loadUser();

    const notificationReceivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log(notification);
      // Handle the notification event
    });

    const notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
      // Handle the notification response event
    });

    return () => {
      notificationReceivedSubscription.remove();
      notificationResponseSubscription.remove();
    }
  }, []);

  useEffect(() => {
    if (!name) return;
    const loadGreeting = async () => {
      const greeting = await performGreetingAction({ name });
      setGretting(greeting);
    }
    loadGreeting();
  }, [name]);

  const setUser = async () => {
    let r = (Math.random() + 1).toString(36).substring(7);
    const userName = `${name}#${r}`;
    await AsyncStorage.setItem("user", userName);
    setName(userName);
    setVisible(false);
  
    // Get the push token and save it to the server.
    const token = await AsyncStorage.getItem("expoPushToken");
    if (token) {
      saveUserToken({token , userId:userName})
    }
  };
  

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F5EA" }}>
      <ScrollView style={styles.container}>
        {groups.map((group) => (
          <Link
            href={{
              pathname: "/(chat)/[chatid]",
              params: { chatid: group._id },
            }}
            key={group._id.toString()}
            asChild
          >
            <TouchableOpacity style={styles.group}>
              <Image
                source={{ uri: group.icon_url }}
                style={styles.groupIcon}
              />
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupDescription}>{group.description}</Text>
              </View>
            </TouchableOpacity>
          </Link>
        ))}
        <Text style={{ textAlign: 'center', margin: 10 }}>{gretting}</Text>
      </ScrollView>
      <Dialog.Container visible={visible}>
        <Dialog.Title style={styles.dialogTitle}>
          Username required
        </Dialog.Title>
        <Dialog.Description>
          Please insert a name to start chatting
        </Dialog.Description>
        <Dialog.Input onChangeText={setName} />
        <Dialog.Button
          label="Set name"
          onPress={setUser}
          style={styles.dialogButton}
        />
      </Dialog.Container>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  group: {
    flexDirection: "row",
    gap: 15,
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    elevation: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  groupIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  groupDescription: {
    fontSize: 14,
    color: "#888",
    marginTop: 5,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  dialogButton: {
    backgroundColor: "#007BFF",
    color: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    elevation: 3,
  },
});

export default Page;
