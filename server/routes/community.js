const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

const {
  Follow,
  Sangha,
  SanghaMembership,
  Post,
  Comment,
  Kudos,
  SanghaEvent,
  GatheringChatMessage,
  SanghaChatMessage,
  CommunityNotification,
} = require('../models/community');
const User = require('../models/User');
const JourneyEvent = require('../models/JourneyEvent');
const SadhanaLog = require('../models/SadhanaLog');

// ─── 1. FEED: Get community feed by tab (following, discover, sanghas) ──────────
router.get('/feed', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const tab = req.query.tab || 'following';
    const sanghaId = req.query.sanghaId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = { status: 'active' };

    if (sanghaId && mongoose.Types.ObjectId.isValid(sanghaId)) {
      const activeMembership = await SanghaMembership.findOne({
        sanghaId,
        userId,
        status: 'active',
      });
      const targetSangha = await Sangha.findById(sanghaId);
      const isCreator = targetSangha?.createdBy && targetSangha.createdBy.toString() === userId.toString();

      if (!activeMembership && !isCreator) {
        return res.status(403).json({
          message: 'Circle reflections are sacred and visible only to approved circle members',
          feed: [],
          total: 0,
        });
      }
      query.sanghaId = sanghaId;
    } else if (tab === 'following') {
      // Find who the current user follows
      const activeFollows = await Follow.find({
        followerId: userId,
        status: 'active',
      }).select('followingId');
      const followingUserIds = activeFollows.map((f) => f.followingId);

      // If user follows people, show their posts + self + public posts
      // If user has 0 follows, surface active community posts so feed is never an empty void
      if (followingUserIds.length > 0) {
        query.$or = [
          { authorId: { $in: [...followingUserIds, userId] } },
          { audienceIds: 'public' },
          { visibility: 'public' },
        ];
      } else {
        query.$or = [
          { authorId: userId },
          { audienceIds: 'public' },
          { visibility: 'public' },
          { status: 'active' },
        ];
      }
    } else if (tab === 'discover') {
      // Discover: all public posts across seekers and open communities
      query.$or = [
        { audienceIds: 'public' },
        { visibility: 'public' },
      ];
    } else if (tab === 'sanghas') {
      // Sanghas tab: posts from sanghas the user is a member of
      const memberships = await SanghaMembership.find({
        userId,
        status: 'active',
      }).select('sanghaId');
      const joinedSanghaIds = memberships.map((m) => m.sanghaId);

      if (joinedSanghaIds.length > 0) {
        const countInJoined = await Post.countDocuments({
          status: 'active',
          sanghaId: { $in: joinedSanghaIds },
        });
        if (countInJoined > 0) {
          query.sanghaId = { $in: joinedSanghaIds };
        } else {
          // Gracefully show active sangha reflections so seekers never encounter a blank void
          query.sanghaId = { $ne: null };
        }
      } else {
        // If seeker has not yet joined any circles, show active circle reflections with encouragement
        query.sanghaId = { $ne: null };
      }
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'name currentLevel pradakshinaCount')
      .populate('sanghaId', 'name slug type avatarUrl')
      .lean();

    // Check which posts the current seeker has offered kudos to
    const postIds = posts.map((p) => p._id);
    const userKudos = await Kudos.find({
      postId: { $in: postIds },
      userId,
    }).select('postId');

    const kudosSet = new Set(userKudos.map((k) => k.postId.toString()));

    const feed = posts.map((post) => ({
      ...post,
      hasKudos: kudosSet.has(post._id.toString()),
    }));

    const totalCount = await Post.countDocuments(query);

    res.json({
      feed,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
      totalCount,
    });
  } catch (error) {
    console.error('Community feed fetch error:', error);
    res.status(500).json({ message: 'Error retrieving community feed', error: error.message });
  }
});

// ─── 2. POSTS: Create a new community post ───────────────────────────────────
router.post('/posts', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      body,
      type = 'standard',
      media = [],
      sharedEntity = null,
      visibility = 'followers',
      sanghaId = null,
    } = req.body;

    // Validate body or shared content presence
    if (!body && (!media || media.length === 0) && (!sharedEntity || sharedEntity.entityType === 'none')) {
      return res.status(400).json({ message: 'A post must contain text, an image, or a shared practice.' });
    }

    // Build audience IDs based on visibility and target sangha
    const audienceIds = [];
    if (visibility === 'public') {
      audienceIds.push('public', 'followers');
    } else if (visibility === 'followers') {
      audienceIds.push('followers');
    }

    let resolvedSanghaId = null;
    if (sanghaId && mongoose.Types.ObjectId.isValid(sanghaId)) {
      resolvedSanghaId = sanghaId;
      audienceIds.push(`sangha:${sanghaId}`);
    }

    const newPost = new Post({
      authorId: userId,
      type,
      body: body ? body.trim() : '',
      media: Array.isArray(media) ? media : [],
      sharedEntity: sharedEntity && sharedEntity.entityType ? sharedEntity : { entityType: 'none' },
      audienceIds,
      visibility,
      sanghaId: resolvedSanghaId,
    });

    const savedPost = await newPost.save();

    // Increment sangha post count if applicable
    if (resolvedSanghaId) {
      await Sangha.findByIdAndUpdate(resolvedSanghaId, { $inc: { postsCount: 1 } });
    }

    const populatedPost = await Post.findById(savedPost._id)
      .populate('authorId', 'name currentLevel pradakshinaCount')
      .populate('sanghaId', 'name slug type avatarUrl')
      .lean();

    res.status(201).json({
      ...populatedPost,
      hasKudos: false,
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Error creating post', error: error.message });
  }
});

// ─── 3. KUDOS: Toggle Kudos (🙏) on a post ────────────────────────────────────
router.post('/posts/:id/kudos', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid Post ID' });
    }

    const existingKudos = await Kudos.findOne({ postId, userId });

    if (existingKudos) {
      // Remove kudos
      await Kudos.deleteOne({ _id: existingKudos._id });
      const post = await Post.findByIdAndUpdate(
        postId,
        { $inc: { kudosCount: -1 } },
        { new: true }
      ).select('kudosCount');

      return res.json({
        hasKudos: false,
        kudosCount: Math.max(0, post ? post.kudosCount : 0),
      });
    } else {
      // Offer kudos
      await Kudos.create({ postId, userId });
      const post = await Post.findByIdAndUpdate(
        postId,
        { $inc: { kudosCount: 1 } },
        { new: true }
      ).select('kudosCount authorId');

      // Create notification for post author if not self
      if (post && post.authorId.toString() !== userId.toString()) {
        await CommunityNotification.create({
          recipientId: post.authorId,
          actorId: userId,
          type: 'kudos',
          postId,
          message: `${req.user.name || 'A seeker'} offered Kudos (🙏) to your reflection`,
        });
      }

      return res.json({
        hasKudos: true,
        kudosCount: post ? post.kudosCount : 1,
      });
    }
  } catch (error) {
    console.error('Kudos toggle error:', error);
    res.status(500).json({ message: 'Error updating kudos', error: error.message });
  }
});

// ─── 4. COMMENTS: Get comments for a post ────────────────────────────────────
router.get('/posts/:id/comments', auth, async (req, res) => {
  try {
    const postId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid Post ID' });
    }

    const comments = await Comment.find({ postId, status: 'active' })
      .sort({ createdAt: 1 })
      .populate('userId', 'name currentLevel')
      .lean();

    res.json({ comments });
  } catch (error) {
    console.error('Fetch comments error:', error);
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
});

// ─── 5. COMMENTS: Add a comment to a post ────────────────────────────────────
router.post('/posts/:id/comments', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.id;
    const { body, parentCommentId = null } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid Post ID' });
    }

    const comment = new Comment({
      postId,
      userId,
      parentCommentId: parentCommentId && mongoose.Types.ObjectId.isValid(parentCommentId) ? parentCommentId : null,
      body: body.trim(),
    });

    const savedComment = await comment.save();
    const updatedPost = await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } }).select('authorId');

    // Create notification for post author if not self
    if (updatedPost && updatedPost.authorId.toString() !== userId.toString()) {
      const snippet = body.length > 50 ? body.slice(0, 47) + '...' : body;
      await CommunityNotification.create({
        recipientId: updatedPost.authorId,
        actorId: userId,
        type: 'comment',
        postId,
        message: `${req.user.name || 'A seeker'} reflected on your post: "${snippet}"`,
      });
    }

    const populated = await Comment.findById(savedComment._id)
      .populate('userId', 'name currentLevel')
      .lean();

    res.status(201).json({ comment: populated });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Error submitting comment', error: error.message });
  }
});

// ─── 6. FOLLOW: Toggle follow relationship with another seeker ───────────────
router.post('/follow/:targetUserId', auth, async (req, res) => {
  try {
    const followerId = req.user._id;
    const targetUserId = req.params.targetUserId;

    if (followerId.toString() === targetUserId.toString()) {
      return res.status(400).json({ message: 'A seeker cannot follow themselves.' });
    }

    const existingFollow = await Follow.findOne({
      followerId,
      followingId: targetUserId,
    });

    if (existingFollow) {
      await Follow.deleteOne({ _id: existingFollow._id });
      return res.json({ isFollowing: false, message: 'Unfollowed seeker' });
    } else {
      await Follow.create({
        followerId,
        followingId: targetUserId,
        status: 'active',
      });

      // Create notification for followed seeker
      await CommunityNotification.create({
        recipientId: targetUserId,
        actorId: followerId,
        type: 'follow',
        message: `${req.user.name || 'A seeker'} is now walking with you on the path`,
      });

      return res.json({ isFollowing: true, message: 'Now walking with seeker' });
    }
  } catch (error) {
    console.error('Follow toggle error:', error);
    res.status(500).json({ message: 'Error toggling follow', error: error.message });
  }
});

// ─── 7. SANGHAS: Join or Leave a Sangha (with Creator Approval) ─────────────
router.post('/sanghas/:id/join', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const sanghaId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(sanghaId)) {
      return res.status(400).json({ message: 'Invalid Sangha ID' });
    }

    const sangha = await Sangha.findById(sanghaId);
    if (!sangha) {
      return res.status(404).json({ message: 'Sangha not found' });
    }

    const existingMembership = await SanghaMembership.findOne({ sanghaId, userId });

    if (existingMembership) {
      if (existingMembership.status === 'active') {
        // Leave Sangha
        await SanghaMembership.deleteOne({ _id: existingMembership._id });
        const updatedSangha = await Sangha.findByIdAndUpdate(
          sanghaId,
          { $inc: { membersCount: -1 } },
          { new: true }
        );
        return res.json({
          isMember: false,
          membershipStatus: null,
          membersCount: Math.max(1, updatedSangha ? updatedSangha.membersCount : 1),
          message: 'Left Sangha',
        });
      } else {
        // Cancel pending/declined request
        await SanghaMembership.deleteOne({ _id: existingMembership._id });
        return res.json({
          isMember: false,
          membershipStatus: null,
          membersCount: sangha.membersCount,
          message: 'Join request canceled',
        });
      }
    } else {
      // Check if creator or public circle
      const isCreator = sangha.createdBy && sangha.createdBy.toString() === userId.toString();
      const isPublic = sangha.visibility === 'public' && sangha.joinPolicy !== 'request';
      const status = (isCreator || isPublic) ? 'active' : 'pending';
      const role = isCreator ? 'owner' : 'member';

      const newMembership = await SanghaMembership.create({
        sanghaId,
        userId,
        role,
        status,
      });

      if (status === 'active') {
        const updatedSangha = await Sangha.findByIdAndUpdate(
          sanghaId,
          { $inc: { membersCount: 1 } },
          { new: true }
        );
        return res.json({
          isMember: true,
          membershipStatus: 'active',
          membersCount: updatedSangha ? updatedSangha.membersCount : 1,
          message: 'Joined Sangha',
        });
      } else {
        // Notify Sangha creator
        if (sangha.createdBy) {
          await CommunityNotification.create({
            recipientId: sangha.createdBy,
            actorId: userId,
            type: 'join_request',
            sanghaId,
            message: `${req.user.name || 'A seeker'} has requested to join your circle: "${sangha.name}"`,
          });
        }
        return res.json({
          isMember: false,
          membershipStatus: 'pending',
          membersCount: sangha.membersCount,
          message: 'Join request submitted for approval',
        });
      }
    }
  } catch (error) {
    console.error('Sangha join error:', error);
    res.status(500).json({ message: 'Error toggling Sangha membership', error: error.message });
  }
});

// GET /api/community/sanghas/:id/requests (or pending-requests) — Pending join requests
router.get(['/sanghas/:id/requests', '/sanghas/:id/pending-requests'], auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const sanghaId = req.params.id;

    const sangha = await Sangha.findById(sanghaId);
    if (!sangha) return res.status(404).json({ message: 'Sangha not found' });

    const isCreator = sangha.createdBy && sangha.createdBy.toString() === userId.toString();
    const adminMembership = await SanghaMembership.findOne({
      sanghaId,
      userId,
      role: { $in: ['owner', 'admin'] },
      status: 'active',
    });

    if (!isCreator && !adminMembership) {
      return res.status(403).json({ message: 'Only Circle creators and admins can view join requests' });
    }

    const requests = await SanghaMembership.find({ sanghaId, status: 'pending' })
      .populate('userId', 'name currentLevel city email selectedPractices')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Fetch sangha requests error:', error);
    res.status(500).json({ message: 'Error fetching join requests', error: error.message });
  }
});

// PUT /api/community/sanghas/:id/requests/:membershipId — Approve or decline join request
router.put('/sanghas/:id/requests/:membershipId', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { id: sanghaId, membershipId } = req.params;
    const { action } = req.body; // 'approve' | 'decline'

    const sangha = await Sangha.findById(sanghaId);
    if (!sangha) return res.status(404).json({ message: 'Sangha not found' });

    const isCreator = sangha.createdBy && sangha.createdBy.toString() === userId.toString();
    const adminMembership = await SanghaMembership.findOne({
      sanghaId,
      userId,
      role: { $in: ['owner', 'admin'] },
      status: 'active',
    });

    if (!isCreator && !adminMembership) {
      return res.status(403).json({ message: 'Only Circle creators and admins can review join requests' });
    }

    const membership = await SanghaMembership.findById(membershipId);
    if (!membership || membership.sanghaId.toString() !== sanghaId) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    if (action === 'approve') {
      membership.status = 'active';
      await membership.save();
      await Sangha.findByIdAndUpdate(sanghaId, { $inc: { membersCount: 1 } });

      // Notify the seeker
      await CommunityNotification.create({
        recipientId: membership.userId,
        actorId: userId,
        type: 'join_approved',
        sanghaId,
        message: `Your request to join "${sangha.name}" was lovingly approved 🙏 Welcome to the circle!`,
      });

      return res.json({ message: 'Join request approved', status: 'active', membership });
    } else {
      membership.status = 'declined';
      await membership.save();
      return res.json({ message: 'Join request declined', status: 'declined', membership });
    }
  } catch (error) {
    console.error('Review sangha request error:', error);
    res.status(500).json({ message: 'Error reviewing request', error: error.message });
  }
});

// GET /api/community/sanghas/:id/messages — In-circle chat stream for active members
router.get('/sanghas/:id/messages', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const sanghaId = req.params.id;

    const membership = await SanghaMembership.findOne({
      sanghaId,
      userId,
      status: 'active',
    });

    if (!membership) {
      return res.status(403).json({ message: 'Only confirmed members can enter the Circle Chat Sanctuary' });
    }

    const messages = await SanghaChatMessage.find({ sanghaId })
      .sort({ createdAt: 1 })
      .limit(60)
      .populate('senderId', 'name currentLevel')
      .lean();

    res.json({ messages });
  } catch (error) {
    console.error('Fetch circle messages error:', error);
    res.status(500).json({ message: 'Error fetching circle messages', error: error.message });
  }
});

// POST /api/community/sanghas/:id/messages — Send chat message in Circle Sanctuary
router.post('/sanghas/:id/messages', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const sanghaId = req.params.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const membership = await SanghaMembership.findOne({
      sanghaId,
      userId,
      status: 'active',
    });

    if (!membership) {
      return res.status(403).json({ message: 'Only confirmed members can send messages in the Circle Chat Sanctuary' });
    }

    const msg = await SanghaChatMessage.create({
      sanghaId,
      senderId: userId,
      content: content.trim(),
    });

    const populated = await SanghaChatMessage.findById(msg._id)
      .populate('senderId', 'name currentLevel')
      .lean();

    res.status(201).json({ message: populated });
  } catch (error) {
    console.error('Send circle message error:', error);
    res.status(500).json({ message: 'Error posting circle message', error: error.message });
  }
});

// ─── 8. SIDEBAR: Recommended Sanghas, Fellow Seekers, and Seeker Stats ─────────
router.get('/sidebar', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Current seeker stats
    const [followingCount, followersCount, userMemberships] = await Promise.all([
      Follow.countDocuments({ followerId: userId, status: 'active' }),
      Follow.countDocuments({ followingId: userId, status: 'active' }),
      SanghaMembership.find({ userId, status: 'active' }).select('sanghaId'),
    ]);

    const joinedSanghaIds = userMemberships.map((m) => m.sanghaId.toString());

    // Recommended Sanghas (featured or active)
    const sanghas = await Sangha.find({ visibility: 'public' })
      .sort({ isFeatured: -1, membersCount: -1 })
      .limit(5)
      .lean();

    const recommendedSanghas = sanghas.map((s) => ({
      ...s,
      isMember: joinedSanghaIds.includes(s._id.toString()),
    }));

    // Fellow Seekers to follow
    const activeFollows = await Follow.find({ followerId: userId }).select('followingId');
    const followingIds = activeFollows.map((f) => f.followingId.toString());

    const seekers = await User.find({ _id: { $ne: userId } })
      .select('name email currentLevel pradakshinaCount')
      .limit(6)
      .lean();

    const suggestedSeekers = seekers.map((s) => ({
      ...s,
      isFollowing: followingIds.includes(s._id.toString()),
    }));

    res.json({
      stats: {
        followingCount,
        followersCount,
        sanghasCount: joinedSanghaIds.length,
      },
      recommendedSanghas,
      suggestedSeekers,
    });
  } catch (error) {
    console.error('Sidebar error:', error);
    res.status(500).json({ message: 'Error fetching community sidebar', error: error.message });
  }
});

// ─── 8A2. WALKING COMPANIONS: Seekers the user is walking with on the Kailash trail ───
router.get('/walking-companions', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const activeFollows = await Follow.find({
      followerId: userId,
      status: 'active',
    }).select('followingId');

    const followingIds = activeFollows.map((f) => f.followingId);

    if (followingIds.length === 0) {
      return res.json({ companions: [] });
    }

    const companions = await User.find({ _id: { $in: followingIds } })
      .select('name email currentLevel totalCumulativeScore pradakshinaCount selectedPractices avatarUrl')
      .lean();

    const formattedCompanions = companions.map((c) => ({
      _id: c._id,
      name: c.name || 'Anonymous Seeker',
      email: c.email,
      currentLevel: Math.max(1, Math.min(108, c.currentLevel || 1)),
      totalCumulativeScore: c.totalCumulativeScore || 0,
      pradakshinaCount: c.pradakshinaCount || 0,
      selectedPractices: c.selectedPractices || [],
      avatarUrl: c.avatarUrl || '',
    }));

    res.json({ companions: formattedCompanions });
  } catch (error) {
    console.error('Walking companions error:', error);
    res.status(500).json({ message: 'Error retrieving walking companions', error: error.message });
  }
});


// ─── 8B. SEEKERS SEARCH: Search fellow seekers by name, email, or practice ───
router.get('/seekers', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { q = '', limit = 12, page = 1 } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 12));
    const skip = (pageNum - 1) * limitNum;

    const filter = { _id: { $ne: userId } };

    const cleanQ = typeof q === 'string' ? q.trim() : '';
    if (cleanQ) {
      const escaped = cleanQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [
        { name: regex },
        { email: regex },
        { selectedPractices: regex },
      ];
    }

    const [seekers, totalCount, activeFollows] = await Promise.all([
      User.find(filter)
        .select('name email currentLevel selectedPractices pradakshinaCount totalCumulativeScore')
        .sort({ currentLevel: -1, totalCumulativeScore: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
      Follow.find({ followerId: userId, status: 'active' }).select('followingId'),
    ]);

    const followingIds = new Set(activeFollows.map((f) => f.followingId.toString()));

    const annotatedSeekers = seekers.map((s) => ({
      _id: s._id,
      name: s.name,
      email: s.email,
      currentLevel: s.currentLevel || 1,
      selectedPractices: s.selectedPractices || [],
      pradakshinaCount: s.pradakshinaCount || 0,
      totalCumulativeScore: s.totalCumulativeScore || 0,
      isFollowing: followingIds.has(s._id.toString()),
    }));

    res.json({
      seekers: annotatedSeekers,
      total: totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum) || 1,
    });
  } catch (error) {
    console.error('Seekers search error:', error);
    res.status(500).json({ message: 'Error searching fellow seekers', error: error.message });
  }
});

// ─── 8C. SEEKER PROFILE: Get detailed seeker profile, active practices & recent reflections ───
router.get('/seekers/:id', auth, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: 'Invalid seeker ID' });
    }

    const seeker = await User.findById(targetId)
      .select('name email currentLevel selectedPractices pradakshinaCount totalCumulativeScore journeyStartDate originStoryText')
      .lean();

    if (!seeker) {
      return res.status(404).json({ message: 'Seeker not found' });
    }

    const targetObjId = new mongoose.Types.ObjectId(targetId);
    const currentObjId = new mongoose.Types.ObjectId(currentUserId);

    const isSelf = currentUserId.toString() === targetId.toString();

    const [followingCount, followersCount, userFollowDoc, sanghaMemberships, recentPosts] = await Promise.all([
      Follow.countDocuments({ followerId: targetObjId, status: 'active' }),
      Follow.countDocuments({ followingId: targetObjId, status: 'active' }),
      isSelf ? null : Follow.findOne({ followerId: currentObjId, followingId: targetObjId, status: 'active' }),
      SanghaMembership.find({ userId: targetObjId, status: 'active' })
        .populate('sanghaId', 'name slug type')
        .lean(),
      Post.find({ authorId: targetObjId, status: 'active' })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('sanghaId', 'name slug type')
        .lean(),
    ]);

    const isFollowing = Boolean(userFollowDoc);
    const sanghas = sanghaMemberships.map(m => m.sanghaId).filter(Boolean);

    res.json({
      seeker: {
        ...seeker,
        isSelf,
        isFollowing,
        stats: {
          followingCount,
          followersCount,
          sanghasCount: sanghas.length,
        },
        sanghas,
        recentPosts,
      },
    });
  } catch (error) {
    console.error('Seeker detail error:', error);
    res.status(500).json({ message: 'Error retrieving seeker details', error: error.message });
  }
});

// ─── 9. SANGHAS DIRECTORY: Browse & filter all Sanghas ─────────────────────────
router.get('/sanghas', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, search, my } = req.query;

    let query = { visibility: 'public' };

    if (type && type !== 'all') {
      query.type = type;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { tagline: searchRegex }, { location: searchRegex }];
    }

    // Get current seeker's memberships (active & pending)
    const memberships = await SanghaMembership.find({
      userId,
    }).select('sanghaId role status');

    const membershipMap = new Map(
      memberships.map((m) => [m.sanghaId.toString(), m])
    );

    if (my === 'true') {
      const activeIds = memberships.filter(m => m.status === 'active').map(m => m.sanghaId);
      query._id = { $in: activeIds };
      delete query.visibility;
    }

    const sanghas = await Sangha.find(query)
      .sort({ isFeatured: -1, membersCount: -1, createdAt: -1 })
      .lean();

    const ownerSanghaIds = sanghas
      .filter((s) => (s.createdBy && s.createdBy.toString() === userId.toString()) || membershipMap.get(s._id.toString())?.role === 'owner')
      .map((s) => s._id);

    let pendingCountsMap = {};
    if (ownerSanghaIds.length > 0) {
      const pendingCounts = await SanghaMembership.aggregate([
        { $match: { sanghaId: { $in: ownerSanghaIds }, status: 'pending' } },
        { $group: { _id: '$sanghaId', count: { $sum: 1 } } }
      ]);
      pendingCounts.forEach(p => {
        pendingCountsMap[p._id.toString()] = p.count;
      });
    }

    const enriched = sanghas.map((s) => {
      const m = membershipMap.get(s._id.toString());
      const isOwner = (s.createdBy && s.createdBy.toString() === userId.toString()) || (m && m.role === 'owner');
      const isPrivateCircle = s.visibility === 'private' || s.joinPolicy === 'request';
      return {
        ...s,
        isMember: m?.status === 'active',
        membershipStatus: m ? m.status : null,
        userRole: m ? m.role : null,
        isOwner,
        isPrivateCircle,
        pendingRequestsCount: isOwner ? (pendingCountsMap[s._id.toString()] || 0) : 0,
      };
    });

    res.json({ sanghas: enriched });
  } catch (error) {
    console.error('Sanghas directory error:', error);
    res.status(500).json({ message: 'Error fetching sanghas directory', error: error.message });
  }
});

// POST /api/community/notifications/:id/read — Mark single notification as read
router.post('/notifications/:id/read', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    await CommunityNotification.updateOne({ _id: req.params.id, recipientId: userId }, { isRead: true });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark single read error:', error);
    res.status(500).json({ message: 'Error updating notification', error: error.message });
  }
});

// ─── 10. SANGHA DETAIL: Fetch single Sangha by ID or Slug ────────────────────
router.get('/sanghas/:idOrSlug', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { idOrSlug } = req.params;

    let query = {};
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      query._id = idOrSlug;
    } else {
      query.slug = idOrSlug.toLowerCase();
    }

    const sangha = await Sangha.findOne(query)
      .populate('createdBy', 'name currentLevel')
      .lean();

    if (!sangha) {
      return res.status(404).json({ message: 'Sangha not found' });
    }

    const membership = await SanghaMembership.findOne({
      sanghaId: sangha._id,
      userId,
    });

    const isOwnerOrAdmin = (sangha.createdBy && sangha.createdBy._id?.toString() === userId.toString()) ||
      (membership && ['owner', 'admin'].includes(membership.role));
    const isPrivateCircle = sangha.visibility === 'private' || sangha.joinPolicy === 'request';

    res.json({
      sangha: {
        ...sangha,
        isMember: membership?.status === 'active',
        membershipStatus: membership ? membership.status : null,
        userRole: membership ? membership.role : null,
        isOwnerOrAdmin,
        isPrivateCircle,
      },
    });
  } catch (error) {
    console.error('Sangha detail error:', error);
    res.status(500).json({ message: 'Error fetching sangha details', error: error.message });
  }
});

// ─── 11. SANGHA MEMBERS: Fetch members of a Sangha ───────────────────────────
router.get('/sanghas/:idOrSlug/members', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { idOrSlug } = req.params;

    let sanghaId = idOrSlug;
    let sanghaDoc;
    if (!mongoose.Types.ObjectId.isValid(idOrSlug)) {
      sanghaDoc = await Sangha.findOne({ slug: idOrSlug.toLowerCase() });
      if (!sanghaDoc) return res.status(404).json({ message: 'Sangha not found' });
      sanghaId = sanghaDoc._id;
    } else {
      sanghaDoc = await Sangha.findById(sanghaId);
      if (!sanghaDoc) return res.status(404).json({ message: 'Sangha not found' });
    }

    const activeMembership = await SanghaMembership.findOne({
      sanghaId,
      userId,
      status: 'active',
    });
    const isCreator = sanghaDoc.createdBy && sanghaDoc.createdBy.toString() === userId.toString();

    if (!activeMembership && !isCreator) {
      return res.status(403).json({
        message: 'Only approved circle members can view fellow seekers in this circle',
        members: [],
      });
    }

    const memberships = await SanghaMembership.find({
      sanghaId,
      status: 'active',
    })
      .sort({ role: 1, createdAt: 1 })
      .populate('userId', 'name currentLevel pradakshinaCount')
      .lean();

    // Check which members the current seeker follows
    const memberUserIds = memberships.map((m) => m.userId?._id).filter(Boolean);
    const follows = await Follow.find({
      followerId: userId,
      followingId: { $in: memberUserIds },
      status: 'active',
    }).select('followingId');

    const followingSet = new Set(follows.map((f) => f.followingId.toString()));

    const members = memberships
      .filter((m) => m.userId)
      .map((m) => ({
        _id: m._id,
        role: m.role,
        joinedAt: m.createdAt,
        user: {
          ...m.userId,
          isFollowing: followingSet.has(m.userId._id.toString()),
          isSelf: m.userId._id.toString() === userId.toString(),
        },
      }));

    res.json({ members });
  } catch (error) {
    console.error('Sangha members error:', error);
    res.status(500).json({ message: 'Error fetching sangha members', error: error.message });
  }
});

// ─── 12. CREATE SANGHA: Start a new sacred circle ────────────────────────────
router.post('/sanghas', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      name,
      tagline = '',
      description = '',
      type = 'interest',
      location = '',
      joinPolicy = 'open',
      visibility = 'public',
      isPrivate,
    } = req.body;

    const finalVisibility = isPrivate === true || visibility === 'private' ? 'private' : 'public';
    const finalJoinPolicy = isPrivate === true || joinPolicy === 'request' || visibility === 'private' ? 'request' : 'open';

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Sangha name is required.' });
    }

    // Generate base slug
    const slugBase = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    let slug = slugBase;
    let count = 1;
    while (await Sangha.findOne({ slug })) {
      slug = `${slugBase}-${count++}`;
    }

    const sangha = new Sangha({
      name: name.trim(),
      slug,
      tagline: tagline.trim(),
      description: description.trim(),
      type,
      location: location.trim(),
      joinPolicy: finalJoinPolicy,
      visibility: finalVisibility,
      createdBy: userId,
      membersCount: 1,
      postsCount: 0,
    });

    const savedSangha = await sangha.save();

    // Create Owner membership
    await SanghaMembership.create({
      sanghaId: savedSangha._id,
      userId,
      role: 'owner',
      status: 'active',
    });

    res.status(201).json({
      sangha: {
        ...savedSangha.toObject(),
        isMember: true,
        userRole: 'owner',
      },
    });
  } catch (error) {
    console.error('Create sangha error:', error);
    res.status(500).json({ message: 'Error creating sangha', error: error.message });
  }
});

// ─── 13. SHAREABLE ENTITIES: Recent personal journey events & sadhana logs ─────
router.get('/shareable-entities', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const [journeyEvents, sadhanaLogs] = await Promise.all([
      JourneyEvent.find({ userId }).sort({ date: -1 }).limit(15).lean(),
      SadhanaLog.find({ userId }).sort({ date: -1 }).limit(7).lean(),
    ]);

    const formattedEvents = journeyEvents.map((ev) => ({
      id: ev._id.toString(),
      entityType: ev.category === 'sadhana' ? 'sadhana_log' : 'milestone',
      title: ev.title,
      subtitle: ev.category ? `${ev.category.toUpperCase()} • ${new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Personal Journey',
      metricValue: ev.category === 'program' ? 'Initiated' : 'Milestone',
      icon: ev.icon || '🪷',
      originalDate: ev.date,
      description: ev.description || '',
    }));

    const formattedLogs = [];
    for (const log of sadhanaLogs) {
      if (log.practices && log.practices.length > 0) {
        for (const p of log.practices) {
          formattedLogs.push({
            id: `${log._id}_${p.name}`,
            entityType: 'sadhana_log',
            title: p.name,
            subtitle: `Sadhana Log • ${log.date}`,
            metricValue: p.count ? `${p.count} Completed` : `${p.durationMinutes || 21} mins`,
            icon: '🪷',
            originalDate: new Date(log.date),
            description: `Completed on ${log.date}`,
          });
        }
      }
    }

    res.json({
      entities: [...formattedEvents, ...formattedLogs],
    });
  } catch (error) {
    console.error('Shareable entities error:', error);
    res.status(500).json({ message: 'Error fetching shareable entities', error: error.message });
  }
});

// ─── 14. GATHERINGS / SANGHA EVENTS: Comprehensive Suite ─────────────────────

// GET /api/community/gatherings (and /events) — List all gatherings
const handleGetGatherings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sanghaId, city, type } = req.query;

    let query = {};
    if (sanghaId && mongoose.Types.ObjectId.isValid(sanghaId)) {
      query.sanghaId = sanghaId;
    }
    if (city && city !== 'all') {
      query['venue.city'] = new RegExp(city, 'i');
    }
    if (type && type !== 'all') {
      query.eventType = type;
    }

    const events = await SanghaEvent.find(query)
      .sort({ startTime: 1 })
      .populate('sanghaId', 'name slug type')
      .populate('createdBy', 'name email currentLevel')
      .lean();

    const formatted = events.map((ev) => {
      const isAttending = (ev.attendees || []).some((id) => id.toString() === userId.toString());
      const isCreator = ev.createdBy?._id?.toString() === userId.toString();
      const myReq = (ev.joinRequests || []).find((r) => r.userId?.toString() === userId.toString());
      const pendingRequestsCount = isCreator
        ? (ev.joinRequests || []).filter((r) => r.status === 'pending').length
        : 0;

      return {
        ...ev,
        isAttending,
        isCreator,
        isOwner: isCreator,
        pendingRequestsCount,
        myJoinRequest: myReq ? { status: myReq.status, requestedAt: myReq.requestedAt, note: myReq.note } : null,
      };
    });

    res.json({ gatherings: formatted, events: formatted });
  } catch (error) {
    console.error('Fetch gatherings error:', error);
    res.status(500).json({ message: 'Error fetching gatherings', error: error.message });
  }
};

router.get('/gatherings', auth, handleGetGatherings);
router.get('/events', auth, handleGetGatherings);

// GET /api/community/gatherings/:id — Get detailed gathering view
// GET /api/community/gatherings/:id (or /events/:id) — Dedicated Gathering Detail Page
router.get(['/gatherings/:id', '/events/:id'], auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const gathering = await SanghaEvent.findById(req.params.id)
      .populate('sanghaId', 'name slug type')
      .populate('createdBy', 'name email currentLevel')
      .populate('attendees', 'name email currentLevel city selectedPractices bio')
      .populate('joinRequests.userId', 'name email currentLevel city selectedPractices bio')
      .lean();

    if (!gathering) {
      return res.status(404).json({ message: 'Gathering not found' });
    }

    const isAttending = (gathering.attendees || []).some((att) => att._id.toString() === userId.toString());
    const isCreator = gathering.createdBy?._id?.toString() === userId.toString();
    const myReq = (gathering.joinRequests || []).find(
      (r) => r.userId?._id?.toString() === userId.toString() || r.userId?.toString() === userId.toString()
    );

    // Filter pending join requests: only show full list to creator
    const visibleRequests = isCreator ? gathering.joinRequests : [];

    res.json({
      gathering: {
        ...gathering,
        isAttending,
        isCreator,
        myJoinRequest: myReq ? { status: myReq.status, requestedAt: myReq.requestedAt, note: myReq.note } : null,
        joinRequests: visibleRequests,
      },
    });
  } catch (error) {
    console.error('Fetch gathering detail error:', error);
    res.status(500).json({ message: 'Error fetching gathering detail', error: error.message });
  }
});

// POST /api/community/gatherings — Create a new gathering
const handleCreateGathering = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      sanghaId,
      title,
      description = '',
      eventType = 'in_person',
      startTime,
      endTime,
      locationOrLink = '',
      venue,
      contactPerson,
      agenda = [],
      guidelines = [],
      requiresApproval = true,
      capacity = 40,
    } = req.body;

    if (!title || !startTime) {
      return res.status(400).json({ message: 'Gathering title and start time are required.' });
    }

    const event = new SanghaEvent({
      sanghaId: sanghaId && mongoose.Types.ObjectId.isValid(sanghaId) ? sanghaId : null,
      title: title.trim(),
      description: description.trim(),
      eventType,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      locationOrLink: locationOrLink.trim(),
      venue: venue || {},
      contactPerson: contactPerson || {},
      agenda: Array.isArray(agenda) ? agenda : [],
      guidelines: Array.isArray(guidelines) ? guidelines : [],
      requiresApproval,
      capacity,
      createdBy: userId,
      attendees: [userId],
      attendeesCount: 1,
    });

    const saved = await event.save();
    res.status(201).json({ gathering: saved, event: saved });
  } catch (error) {
    console.error('Create gathering error:', error);
    res.status(500).json({ message: 'Error creating gathering', error: error.message });
  }
};

router.post('/gatherings', auth, handleCreateGathering);
router.post('/events', auth, handleCreateGathering);

// POST /api/community/gatherings/:id/request-join — Request to join gathering
router.post('/gatherings/:id/request-join', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { note = '' } = req.body;

    const gathering = await SanghaEvent.findById(req.params.id);
    if (!gathering) return res.status(404).json({ message: 'Gathering not found' });

    // Check if already attending
    const isAttending = gathering.attendees.some((id) => id.toString() === userId.toString());
    if (isAttending) {
      return res.status(400).json({ message: 'You are already registered for this gathering.' });
    }

    // If gathering does not require approval, join directly
    if (!gathering.requiresApproval) {
      gathering.attendees.push(userId);
      gathering.attendeesCount = (gathering.attendeesCount || 0) + 1;
      await gathering.save();
      return res.json({ status: 'accepted', isAttending: true, message: 'You have joined the gathering!' });
    }

    // Check existing request
    const existingReq = gathering.joinRequests.find((r) => r.userId.toString() === userId.toString());
    if (existingReq) {
      if (existingReq.status === 'pending') {
        return res.json({ status: 'pending', message: 'Your request is pending review by the gathering host.' });
      }
      if (existingReq.status === 'accepted') {
        return res.json({ status: 'accepted', isAttending: true, message: 'Your request was already accepted.' });
      }
    }

    gathering.joinRequests.push({
      userId,
      status: 'pending',
      requestedAt: new Date(),
      note: note.trim(),
    });

    await gathering.save();

    // Create notification for creator
    if (gathering.createdBy.toString() !== userId.toString()) {
      await CommunityNotification.create({
        recipientId: gathering.createdBy,
        actorId: userId,
        type: 'gathering_rsvp',
        gatheringId: gathering._id,
        entityId: gathering._id,
        entityType: 'SanghaEvent',
        message: `${req.user.name} requested to join your sacred gathering: ${gathering.title}`,
      });
    }

    res.json({
      status: 'pending',
      message: 'Request submitted! The host will review your request shortly.',
    });
  } catch (error) {
    console.error('Request join gathering error:', error);
    res.status(500).json({ message: 'Error submitting join request', error: error.message });
  }
});

// POST /api/community/gatherings/:id/leave — Withdraw request or cancel attendance
router.post('/gatherings/:id/leave', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const gathering = await SanghaEvent.findById(req.params.id);
    if (!gathering) return res.status(404).json({ message: 'Gathering not found' });

    // Remove from attendees if present
    const wasAttending = gathering.attendees.some((id) => id.toString() === userId.toString());
    if (wasAttending) {
      gathering.attendees = gathering.attendees.filter((id) => id.toString() !== userId.toString());
      gathering.attendeesCount = Math.max(0, (gathering.attendeesCount || 1) - 1);
    }

    // Remove any join requests from user
    gathering.joinRequests = (gathering.joinRequests || []).filter(
      (r) => r.userId.toString() !== userId.toString()
    );

    await gathering.save();

    res.json({
      success: true,
      isAttending: false,
      myJoinRequest: null,
      attendeesCount: gathering.attendeesCount,
      message: wasAttending ? 'Attendance canceled.' : 'Join request withdrawn.',
    });
  } catch (error) {
    console.error('Leave gathering error:', error);
    res.status(500).json({ message: 'Error updating attendance', error: error.message });
  }
});

// PUT /api/community/gatherings/:id/requests/:requestId — Host accepts or declines join request
router.put('/gatherings/:id/requests/:requestId', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { action } = req.body; // 'accepted' | 'declined'

    if (!['accepted', 'declined'].includes(action)) {
      return res.status(400).json({ message: "Action must be 'accepted' or 'declined'." });
    }

    const gathering = await SanghaEvent.findById(req.params.id);
    if (!gathering) return res.status(404).json({ message: 'Gathering not found' });

    if (gathering.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only the gathering host can review join requests.' });
    }

    const requestItem = gathering.joinRequests.id(req.params.requestId);
    if (!requestItem) {
      return res.status(404).json({ message: 'Join request not found.' });
    }

    requestItem.status = action;

    if (action === 'accepted') {
      const isAlreadyAttendee = gathering.attendees.some(
        (id) => id.toString() === requestItem.userId.toString()
      );
      if (!isAlreadyAttendee) {
        gathering.attendees.push(requestItem.userId);
        gathering.attendeesCount = (gathering.attendeesCount || 0) + 1;
      }

      // Notify the seeker
      await CommunityNotification.create({
        recipientId: requestItem.userId,
        actorId: userId,
        type: 'gathering_rsvp',
        gatheringId: gathering._id,
        entityId: gathering._id,
        entityType: 'SanghaEvent',
        message: `Your request to join "${gathering.title}" has been accepted! See you there in sacred presence. 🙏`,
      });
    }

    await gathering.save();

    res.json({
      message: `Request marked as ${action}.`,
      request: requestItem,
      attendeesCount: gathering.attendeesCount,
    });
  } catch (error) {
    console.error('Review request error:', error);
    res.status(500).json({ message: 'Error processing request', error: error.message });
  }
});

// GET /api/community/gatherings/:id/messages — Gathering Chat messages
router.get('/gatherings/:id/messages', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const gathering = await SanghaEvent.findById(req.params.id);
    if (!gathering) return res.status(404).json({ message: 'Gathering not found' });

    const isAttending = gathering.attendees.some((id) => id.toString() === userId.toString());
    const isCreator = gathering.createdBy.toString() === userId.toString();

    if (!isAttending && !isCreator) {
      return res.status(403).json({ message: 'Gathering discussion is reserved for confirmed attendees.' });
    }

    const messages = await GatheringChatMessage.find({ gatheringId: req.params.id })
      .sort({ createdAt: 1 })
      .limit(100)
      .populate('senderId', 'name email currentLevel')
      .lean();

    res.json({ messages });
  } catch (error) {
    console.error('Fetch gathering messages error:', error);
    res.status(500).json({ message: 'Error fetching chat messages', error: error.message });
  }
});

// POST /api/community/gatherings/:id/messages — Send Gathering Chat message
router.post('/gatherings/:id/messages', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content cannot be empty.' });
    }

    const gathering = await SanghaEvent.findById(req.params.id);
    if (!gathering) return res.status(404).json({ message: 'Gathering not found' });

    const isAttending = gathering.attendees.some((id) => id.toString() === userId.toString());
    const isCreator = gathering.createdBy.toString() === userId.toString();

    if (!isAttending && !isCreator) {
      return res.status(403).json({ message: 'Only confirmed attendees can send messages in this gathering.' });
    }

    const message = new GatheringChatMessage({
      gatheringId: req.params.id,
      senderId: userId,
      content: content.trim(),
    });

    await message.save();
    const populated = await GatheringChatMessage.findById(message._id)
      .populate('senderId', 'name email currentLevel')
      .lean();

    res.status(201).json({ message: populated });
  } catch (error) {
    console.error('Send gathering message error:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

// POST /api/community/events/:id/rsvp (legacy alias)
router.post('/events/:id/rsvp', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const eventId = req.params.id;

    const event = await SanghaEvent.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Gathering not found' });

    const isAttending = event.attendees.some((id) => id.toString() === userId.toString());

    if (isAttending) {
      event.attendees = event.attendees.filter((id) => id.toString() !== userId.toString());
      event.attendeesCount = Math.max(0, event.attendeesCount - 1);
      await event.save();
      return res.json({ isAttending: false, attendeesCount: event.attendeesCount });
    } else {
      // Check if requires host approval
      if (event.requiresApproval && event.createdBy.toString() !== userId.toString()) {
        const existingReqIndex = (event.joinRequests || []).findIndex(
          (r) => r.userId.toString() === userId.toString()
        );
        if (existingReqIndex >= 0) {
          // Cancel pending request
          event.joinRequests.splice(existingReqIndex, 1);
          await event.save();
          return res.json({ isAttending: false, myJoinRequest: null, message: 'Request withdrawn' });
        } else {
          // Submit request
          event.joinRequests.push({
            userId,
            status: 'pending',
            requestedAt: new Date(),
            note: 'RSVP from community dashboard',
          });
          await event.save();
          if (event.createdBy) {
            await CommunityNotification.create({
              recipientId: event.createdBy,
              actorId: userId,
              type: 'gathering_rsvp',
              gatheringId: event._id,
              entityId: event._id,
              entityType: 'SanghaEvent',
              message: `${req.user.name || 'A seeker'} requested to join your sacred gathering: ${event.title}`,
            });
          }
          return res.json({
            isAttending: false,
            myJoinRequest: { status: 'pending' },
            message: 'Request submitted for host approval',
          });
        }
      } else {
        event.attendees.push(userId);
        event.attendeesCount = (event.attendeesCount || 0) + 1;
        await event.save();
        return res.json({ isAttending: true, attendeesCount: event.attendeesCount });
      }
    }
  } catch (error) {
    console.error('RSVP error:', error);
    res.status(500).json({ message: 'Error updating gathering attendance', error: error.message });
  }
});

// ─── 15. NOTIFICATIONS: Get & Mark Read ───────────────────────────────────────
router.get('/notifications', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const [notifications, unreadCount] = await Promise.all([
      CommunityNotification.find({ recipientId: userId })
        .sort({ createdAt: -1 })
        .limit(25)
        .populate('actorId', 'name currentLevel')
        .populate('sanghaId', 'name slug')
        .populate('gatheringId', 'title')
        .lean(),
      CommunityNotification.countDocuments({ recipientId: userId, isRead: false }),
    ]);

    // Backward-compatibility: enrich gathering notifications if missing gatheringId
    const enriched = await Promise.all(
      notifications.map(async (n) => {
        if (
          !n.gatheringId &&
          !n.entityId &&
          n.message &&
          n.message.includes('requested to join your sacred gathering:')
        ) {
          const title = n.message.split('requested to join your sacred gathering:')[1]?.trim();
          if (title) {
            const ev = await SanghaEvent.findOne({ title }).select('_id').lean();
            if (ev) {
              n.gatheringId = ev;
              n.entityId = ev._id;
              n.entityType = 'SanghaEvent';
              n.type = 'gathering_rsvp';
            }
          }
        }
        return n;
      })
    );

    res.json({ notifications: enriched, unreadCount });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

router.post('/notifications/read', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    await CommunityNotification.updateMany({ recipientId: userId, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Error updating notifications', error: error.message });
  }
});

// ─── 16. MODERATION & DELETION ───────────────────────────────────────────────
router.post('/posts/:id/flag', auth, async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findByIdAndUpdate(postId, { status: 'flagged' }, { new: true });
    res.json({ success: true, message: 'Post flagged for review', post });
  } catch (error) {
    console.error('Flag post error:', error);
    res.status(500).json({ message: 'Error flagging post', error: error.message });
  }
});

router.delete('/posts/:id', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.authorId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized to remove this post.' });
    }

    await Post.findByIdAndUpdate(postId, { status: 'hidden' });
    res.json({ success: true, message: 'Post removed.' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Error deleting post', error: error.message });
  }
});

router.delete('/comments/:id', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const commentId = req.params.id;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized to remove this comment.' });
    }

    await Comment.findByIdAndUpdate(commentId, { status: 'deleted' });
    await Post.findByIdAndUpdate(comment.postId, { $inc: { commentsCount: -1 } });
    res.json({ success: true, message: 'Comment removed.' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
});

module.exports = router;
