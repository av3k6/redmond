
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabase } from "@/hooks/useSupabase";
import { ConversationsState } from "./types";
import { Conversation } from "@/types/message";

export function useFetchConversations() {
  const { supabase } = useSupabase();
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchConversations = async (
    setState: React.Dispatch<React.SetStateAction<ConversationsState>>
  ) => {
    if (!user) return null;
    
    setState(prev => ({ ...prev, loading: true }));
    try {
      console.log("Fetching conversations for user:", user.id);
      
      // Fetch conversations
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', [user.id])
        .order('last_message_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching conversations:", error);
        throw error;
      }
      
      console.log("Conversations fetched:", data?.length || 0);
      
      // Map database column names to our client-side property names
      const mappedConversations = data?.map(conv => ({
        id: conv.id,
        participants: conv.participants,
        lastMessageAt: conv.last_message_at,
        subject: conv.subject || undefined,
        propertyId: conv.property_id || undefined,
        unreadCount: conv.unread_count || 0
      })) || [];
      
      setState(prev => ({ 
        ...prev, 
        conversations: mappedConversations,
        loading: false
      }));
      
      return mappedConversations as Conversation[] | null;
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Could not load conversations",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, loading: false, conversations: [] }));
      return null;
    }
  };

  return { fetchConversations };
}
