import { v } from "convex/values";
import {mutation, query} from "./_generated/server";
export const sendMessage = mutation({
    args:{content: v.string() , group_id: v.id('groups') , user:v.string(), file: v.optional(v.string())},
    handler:async(context , args)=>{
        await context.db.insert('messages',args);   
        }
})


export const get = query({
    args:{chatId : v.id('groups')},
    handler:async({db , storage} , {chatId})=>{
        const messages = await db.query('messages').filter((q)=> q.eq(q.field('group_id'),chatId)).collect();
        return Promise.all(
            messages.map(async (message)=>{
                if(message.file){
                    const url = await storage.getUrl(message.file);
                    if(url){
                        return {...message , file:url}
                    }
                }
                return message

            })
        )
    }
})
