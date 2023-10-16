import {  Text, KeyboardAvoidingView, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { TextInput } from 'react-native-gesture-handler';

const Page = () => {
    const [name , setName] = useState('');
    const [desc , setDesc] = useState('');
    const [icon , setIcon] = useState('');
    const router = useRouter();
    const startGroup = useMutation(api.group.create);
    const onCreateGroup = async () =>{
        await startGroup({
            name,
            description:desc,
            icon_url:icon,
        });
        router.back();
    }
  return (
    <KeyboardAvoidingView style={styles.contaier}>
      <Text style={styles.label}>Name:</Text>
      <TextInput style={styles.textInput} value={name} onChangeText={setName}></TextInput>
      <Text style={styles.label}>Description:</Text>
      <TextInput style={styles.textInput} value={desc} onChangeText={setDesc}></TextInput>
      <Text style={styles.label}>Icon Url:</Text>
      <TextInput style={styles.textInput} value={icon} onChangeText={setIcon}></TextInput>

      <TouchableOpacity style={styles.button} onPress={onCreateGroup}>
        <Text style={styles.buttonText}>Create</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  )
}
const styles = StyleSheet.create({
    contaier:{
        flex:1,
        backgroundColor:'#F8F5EA',
        padding:10,
    },
    label:{
        marginVertical:10,
    },
    textInput:{
        borderWidth:1,
        borderColor:'gray',
        borderRadius:5,
        paddingHorizontal:10,
        minHeight:40,
        backgroundColor:'#fff',
        color:'black',
    },
    button:{
        backgroundColor:'#EEA217',
        borderRadius:5,
        padding:10,
        marginVertical:10,
        justifyContent:'center',
        alignItems:'center',

    },
    buttonText:{
        color:'white',
        textAlign:'center',
        fontSize:16,
        fontWeight:'bold',
    }

})

export default Page