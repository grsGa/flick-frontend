// General TypeScript types for the application

export interface NavItem {
  label: string;
  href: string | ((username: string) => string);
  icon: React.ComponentType<any>;
}

export interface MediaFile {
  id?: string;
  url: string;
  type: 'image' | 'video';
  file?: File;
}

export interface ComposeState {
  content: string;
  media: MediaFile[];
}

export interface ProfileTab {
  id: string;
  label: string;
  href: string;
}