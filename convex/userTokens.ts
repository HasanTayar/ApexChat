import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const saveUserToken = mutation({
  args: { token: v.string(), userId: v.string() },
  handler: async (context, args) => {
    await context.db.insert("user_tokens", args);
  },
});
export const getToken = query({
    args: { userId: v.string() },
    handler: async (context, { userId }) => {
        const userToken = await context.db.query('user_tokens')
                                       .filter((q) => q.eq(q.field('userId'), userId))
                                       .unique();
        return userToken ? userToken.token : null;
    }
});
