import { getSupabaseClient } from "../api/apiClient.js";

/**
 * Send a notification to a user
 */
export const sendNotification = async (
  recipientId,
  message,
  linkTo = null,
  universityId = null
) => {
  try {
    const supabase = getSupabaseClient();
    console.log("📬 Inserting notification:", {
      recipientId,
      message,
      linkTo,
      universityId,
    });

    // If universityId is not provided, fetch it from the recipient's profile
    let finalUniversityId = universityId;

    if (!finalUniversityId) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("university_id")
        .eq("id", recipientId)
        .single();

      if (profileError) {
        console.error("❌ Error fetching user university:", profileError);
        return false;
      }

      finalUniversityId = profile?.university_id;
      console.log("🏫 Fetched university_id:", finalUniversityId);
    }

    if (!finalUniversityId) {
      console.error("❌ No university_id found for user:", recipientId);
      return false;
    }

    const { data, error } = await supabase.from("notifications").insert({
      recipient_id: recipientId,
      message,
      status: "unread",
      link_to: linkTo,
      university_id: finalUniversityId,
      created_at: new Date().toISOString(),
    });

    console.log("💾 Insert result:", { data, error });

    if (error) {
      console.error("❌ Error sending notification:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("❌ Error in sendNotification:", err);
    return false;
  }
};

/**
 * Notify user about post status update
 */
export const notifyPostStatusUpdate = async (
  userId,
  postTitle,
  status,
  postId
) => {
  console.log("🚀 notifyPostStatusUpdate called with:", {
    userId,
    postTitle,
    status,
    postId,
  });

  const message =
    status === "approved"
      ? `Your post "${postTitle}" has been approved and is now visible.`
      : `Your post "${postTitle}" has been rejected by the moderator.`;

  const linkTo = status === "approved" ? `/item/${postId}` : `/my-posts`;

  console.log("📧 Preparing notification:", { userId, message, linkTo });

  const result = await sendNotification(userId, message, linkTo);

  console.log("✉️ Notification send result:", result);

  return result;
};

/**
 * Notify all admins of a university about a new pending post
 */
export const notifyAdminsNewPost = async (universityId, postTitle, postId) => {
  try {
    const supabase = getSupabaseClient();
    const { data: admins, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("university_id", universityId)
      .eq("role", "admin");

    if (error) {
      console.error("Error fetching admins:", error);
      return;
    }

    if (!admins || admins.length === 0) {
      console.log("No admins found for university:", universityId);
      return;
    }

    const message = `New post awaiting moderation: "${postTitle}"`;
    const linkTo = `/admin/posts`;

    const notificationPromises = admins.map((admin) =>
      sendNotification(admin.id, message, linkTo)
    );

    await Promise.all(notificationPromises);
    console.log(`Notified ${admins.length} admin(s) about new post`);
  } catch (err) {
    console.error("Error in notifyAdminsNewPost:", err);
  }
};

/**
 * Notify user about claim status update
 */
export const notifyClaimStatusUpdate = async (
  userId,
  itemTitle,
  status,
  claimId
) => {
  const message =
    status === "approved"
      ? `Your claim for "${itemTitle}" has been approved!`
      : `Your claim for "${itemTitle}" has been rejected.`;

  const linkTo = `/claims/${claimId}`;

  await sendNotification(userId, message, linkTo);
};

/**
 * Notify item owner about a new claim
 */
export const notifyNewClaim = async (ownerId, itemTitle, claimId) => {
  const message = `Someone has claimed your item: "${itemTitle}"`;
  const linkTo = `/claims/${claimId}`;

  await sendNotification(ownerId, message, linkTo);
};

/**
 * Notify relevant users when an item is marked as recovered
 */
export const notifyItemRecovered = async (itemOwnerId, itemTitle, itemId) => {
  const message = `Item "${itemTitle}" has been marked as recovered!`;
  const linkTo = `/item/${itemId}`;

  await sendNotification(itemOwnerId, message, linkTo);
};
