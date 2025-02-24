const NotificationModel = require('../models/notificationModel');

module.exports = class Notification {
  constructor({ recipient, sender, postId, postReact }) {
    this.sender = sender;
    this.recipient = recipient;
    this.postId = postId;
    this.postReact = postReact;
  }

  async send({ body, click, type, path, NotiType }) {
    let newNotification = null;

    if (NotiType !== 'message') {
      newNotification = await NotificationModel.create({
        sender: this.sender._id,
        recipient: this.recipient._id,
        type,
        click: path,
        content: body,
      });

      await newNotification.save();
    }

    return newNotification;
  }

  async sendPostReact() {
    const postLink = `${process.env.FRONTEND_URL}/${this.recipient.username}/posts/${this.postId}`;
    const path = `/${this.recipient.username}/posts/${this.postId}`;

    const noti = await this.send({
      body: `${this.sender.first_name} reacted ${this.postReact} on your post`,
      click: postLink,
      type: 'react',
      path: path,
    });
    return noti;
  }

  async sendPostComment() {
    const postLink = `${process.env.FRONTEND_URL}/${this.recipient.username}/posts/${this.postId}`;
    const path = `/${this.recipient.username}/posts/${this.postId}`;

    const noti = await this.send({
      body: `${this.sender.first_name} commented ${this.postReact} on your post`,
      click: postLink,
      type: 'comment',
      path: path,
    });
    return noti;
  }

  async sendCommentLike() {
    const postLink = `${process.env.FRONTEND_URL}/${this.recipient.username}/posts/${this.postId}`;
    const path = `/${this.recipient.username}/posts/${this.postId}`;

    const noti = await this.send({
      body: `${this.sender.first_name} reacted like to your comment`,
      click: postLink,
      type: 'react',
      path: path,
    });
    return noti;
  }

  async sendFollow() {
    const postLink = `${process.env.FRONTEND_URL}/profile/${this.sender.username}`;
    const path = `/profile/${this.sender.username}`;

    const noti = await this.send({
      body: `${this.sender.first_name} Followed you`,
      click: postLink,
      type: 'follow',
      path: path,
    });
    return noti;
  }

  async sendMessage() {
    const link = `${process.env.FRONTEND_URL}/messages/${this.postId}`;
    const path = `/messages/${this.postId}`;

    const noti = await this.send({
      body: `${this.sender.first_name} sent you a message : ${this.postReact}`,
      click: link,
      type: 'follow',
      path: path,
      NotiType: 'message',
    });
    return noti;
  }
};
