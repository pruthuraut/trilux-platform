'use client';
import React, { useState } from 'react';
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  BugIcon,
  CircleUser,
  ClipboardMinus,
  CodeSquare,
  FileText,
  Home,
  Menu,
  ShieldAlert,
  ShieldCheck,
  CrossIcon,
  Settings2Icon,
  ShieldEllipsisIcon,
  AlertCircleIcon,
  UserCircleIcon,
  X,
  Check,
  Clock
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// Sample notifications data
const notifications = [
  {
    id: 1,
    title: "Security Alert",
    message: "Unusual login attempt detected from new IP address",
    type: "alert",
    time: "5 minutes ago",
    read: false
  },
  {
    id: 2,
    title: "System Update",
    message: "New security patch available for installation",
    type: "info",
    time: "1 hour ago",
    read: false
  },
  {
    id: 3,
    title: "Task Completed",
    message: "Weekly security scan completed successfully",
    type: "success",
    time: "2 hours ago",
    read: true
  },
  {
    id: 4,
    title: "Maintenance Notice",
    message: "Scheduled maintenance in 24 hours",
    type: "info",
    time: "5 hours ago",
    read: true
  }
];

const NotificationItem = ({ notification, onRead }: { 
  notification: { 
    id: number;
    title: string;
    message: string;
    type: string;
    time: string;
    read: boolean;
  };
  onRead: (id: number) => void;
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertCircleIcon className="h-5 w-5 text-red-500" />;
      case 'success':
        return <Check className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className={`flex items-start gap-3 p-3 transition-colors hover:bg-accent/50 ${!notification.read ? 'bg-accent/20' : ''}`}>
      {getIcon(notification.type)}
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{notification.title}</p>
          {!notification.read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onRead(notification.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{notification.message}</p>
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{notification.time}</span>
        </div>
      </div>
    </div>
  );
};

const NotificationsPopover = () => {
  const [notificationState, setNotificationState] = useState(notifications);
  const unreadCount = notificationState.filter(n => !n.read).length;

  const handleMarkAsRead = (id: number) => {
    setNotificationState(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotificationState(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -right-1 -top-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[380px] p-0" 
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notificationState.length > 0 ? (
            <div className="divide-y">
              {notificationState.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={handleMarkAsRead}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center">
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          )}
        </ScrollArea>
        <div className="border-t p-2">
          <Button variant="ghost" size="sm" className="w-full text-xs">
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsPopover;
// Replace the existing Bell button in your Sidebar component with:
