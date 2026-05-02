import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument, NotificationStatus } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(userId: string, message: string, type = 'system'): Promise<Notification> {
    const notification = new this.notificationModel({
      userId: new Types.ObjectId(userId),
      message,
      type,
    });
    return notification.save();
  }

  async findAllForUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const query = { userId: new Types.ObjectId(userId) };

    const [data, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.notificationModel.countDocuments(query),
      this.notificationModel.countDocuments({ ...query, status: NotificationStatus.UNREAD }),
    ]);

    return { data, total, unreadCount, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationModel.findOneAndUpdate(
      { _id: notificationId, userId: new Types.ObjectId(userId) },
      { status: NotificationStatus.READ },
      { new: true },
    );

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async markAllAsRead(userId: string): Promise<{ message: string; updated: number }> {
    const result = await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), status: NotificationStatus.UNREAD },
      { status: NotificationStatus.READ },
    );

    return { message: 'All notifications marked as read', updated: result.modifiedCount };
  }
}
