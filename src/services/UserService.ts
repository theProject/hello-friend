// src/services/UserService.ts
import { supabaseAdmin } from '../lib/supabaseClient';
import { PineconeService } from './PineconeService';
import { v4 as uuidv4 } from 'uuid';

export const UserService = {
  async ensureUserOnboarded(authUser: { email?: string; name?: string; image?: string }) {
    const email = authUser.email!;
    let { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('id, namespace')
      .eq('email', email)
      .single();

    if (!userRecord) {
      const newNamespace = `user-${uuidv4()}`;
      const { data: newUser } = await supabaseAdmin
        .from('users')
        .insert({
          email,
          name: authUser.name || email,
          avatar_url: authUser.image || null,
          namespace: newNamespace,
        })
        .select()
        .single();
      userRecord = newUser;
      console.log(`Onboarded new user ${email} with namespace ${newNamespace}`);
    }

    if (userRecord.namespace) {
      await PineconeService.initNamespace(userRecord.namespace);
    }

    return userRecord.id;
  },

  async getUserIdByEmail(email: string): Promise<string | null> {
    const { data } = await supabaseAdmin.from('users').select('id').eq('email', email).single();
    return data ? data.id : null;
  },
};