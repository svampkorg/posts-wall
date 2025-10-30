export interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  imagePath: string | ArrayBuffer | File | null;
}
