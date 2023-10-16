import { api } from './_generated/api';

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Id } from './_generated/dataModel';

const http = httpRouter()
http.route({
    path:'/sendImage',
    method:'POST',
    handler:httpAction(async (ctx , req )=>{
        const blob = await req.blob();
        const storageId = await ctx.storage.store(blob);
        const user = new URL(req.url).searchParams.get('user') || '';
        const group_id=new URL(req.url).searchParams.get('group_id');
        const content = new URL(req.url).searchParams.get('content' ) || '';
        await ctx.runMutation(api.messages.sendMessage,{
            content,
            user,
            group_id:group_id as Id<'groups'>,
            file: storageId,
        })
        return new Response(JSON.stringify({sucsses:true}))
    })
})
export default http;
