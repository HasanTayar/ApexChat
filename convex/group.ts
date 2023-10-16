import { v } from "convex/values";
import {mutation, query} from "./_generated/server";

export const get = query({
    args:{},
    handler:async(context)=>{
        return await context.db.query('groups').collect();
    }
})
export const getGroup = query({
    args:{id : v.id('groups')},
    handler:async(context , {id})=>{
        return await context.db.query('groups').filter((q)=> q.eq(q.field('_id'),id)).unique();
    }
})

export const create = mutation({
    args:{description : v.string() , name: v.string() ,icon_url : v.string()},
    handler : async({db} , args) =>{
        await db.insert('groups' , args)
    }
})
export const getUsers = query({
    args: { groupId: v.id('groups') },
    handler: async (context, { groupId }) => {
        const groupMessages = await context.db.query('messages')
                                           .filter((q) => q.eq(q.field('group_id'), groupId))
                                           .collect();
        const users = [...new Set(groupMessages.map(message => message.user))];
        return users;
    }
});