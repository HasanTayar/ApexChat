import { Link, Stack } from "expo-router";
import {ConvexProvider,ConvexReactClient} from "convex/react"
import { TouchableOpacity } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL! , {
  unsavedChangesWarning:false,
});

export default function RootLayoutNav() {

  return (
    <ConvexProvider client={convex} >
      <Stack screenOptions={{
        headerStyle:{
          backgroundColor: '#EEA217',
        },
        headerTintColor:'#fff'
      }}>
        <Stack.Screen
        name="index"
        options={{
          headerTitle:'My Chats',
          presentation:'modal',
          headerRight:()=>(
            <Link href={'/(modal)/create' }  asChild>
              <TouchableOpacity>
                <Ionicons name="add" size={32} color="white" />
              </TouchableOpacity>
            </Link>
          ),
        }}
        />
        <Stack.Screen name="(chat)/[chatid]" options={{headerTitle:""}}/>
        
      </Stack>
      </ConvexProvider>
  );
}
