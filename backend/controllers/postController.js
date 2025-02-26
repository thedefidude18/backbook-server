exports.getAllPosts = catchAsync(async (req, res, next) => {
  const user = req.user.id;
  const includeEvents = req.query.includeEvents === 'true';
  
  // Get following users
  const following = await Follow.find({ sender: user });
  const followingIds = following.map((el) => el.recipient.toString());

  // Base filter for posts
  let filter = { user: { $in: [...followingIds, user] } };
  
  // Get posts with pagination
  const features = new APIFeatures(Post.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  
  const posts = await features.query;
  
  // If events should be included
  let combinedFeed = [...posts];
  
  if (includeEvents) {
    // Get recent events (created by user or their following)
    const events = await Event.find({
      $or: [
        { creator: { $in: [...followingIds, user] } },
        { type: 'public' }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(5); // Limit to recent events
    
    // Transform events to match post structure for the frontend
    const formattedEvents = events.map(event => ({
      _id: event._id,
      type: 'event',
      title: event.name || event.title,
      description: event.description,
      banner_url: event.bannerImage,
      location: event.location,
      date: event.date || event.startDate,
      creator: event.creator,
      createdAt: event.createdAt,
      // Add any other fields needed for rendering
    }));
    
    // Combine posts and events, sort by creation date
    combinedFeed = [...posts, ...formattedEvents].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }
  
  // Process reactions as before
  const ids = combinedFeed.map((el) => el._id);
  const reactions = await Reaction.find({
    user: user,
    post: { $in: ids },
  });
  const reactionsIds = reactions.map((el) => el.post.toString());

  const feedWithReactions = combinedFeed.map((item) => {
    if (item.type === 'event') {
      return item; // Events don't have reactions
    }
    
    item.reactions.isLiked = reactionsIds.includes(item._id.toString())
      ? reactions.find((o) => o.post.toString() === item._id.toString()).type
      : '';

    return item;
  });

  res.status(200).json({
    status: 'success',
    length: feedWithReactions.length,
    data: feedWithReactions,
  });
});