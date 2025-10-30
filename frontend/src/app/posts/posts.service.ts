import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { Post } from './post.model';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';
const BASE_URL = environment.baseUrl;

export interface PostsStatus<T> {
  data: T | null;
  loading: boolean;
  editing: Post | null;
  count: number;
}

// provides this injectable at root level so angular can find
// it and also makes it a singleton for the whole project.
@Injectable({ providedIn: 'root' })
export class PostsService {
  private statusState = signal<PostsStatus<Post[]>>({
    data: null,
    loading: false,
    editing: null,
    count: 0,
  });

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  getPosts(postsPerPage?: number, currentPage?: number) {
    let queryParams = ``;

    if (postsPerPage && currentPage) {
      console.log('query params to getPosts:');
      console.log('   - postsPerPage: ', postsPerPage);
      console.log('   - currentPage: ', currentPage);
      queryParams = `?pagesize=${postsPerPage}&page=${currentPage}`;
    }

    console.log('getPosts');
    this.setLoading();
    this.http
      .get<{
        message: string;
        posts: Post[];
        count: number;
      }>(`${BASE_URL}/posts${queryParams}`)
      .subscribe({
        next: (response) => {
          console.log('getPosts got a response ', response.posts);
          this.statusState.update((state) => ({
            ...state,
            data: response.posts,
            loading: false,
            count: response.count,
          }));
        },
        error: (err) => {
          console.error('getPosts error', err);
        },
        complete: () => {
          console.log('getPosts complete');
          // this.getPostsCount();
        },
      });
  }

  public readonly posts: Signal<Post[]> = computed(() => this.statusState().data ?? []);
  public readonly loading: Signal<boolean> = computed(() => this.statusState().loading);
  public readonly editing: Signal<Post | null> = computed(() => this.statusState().editing);
  public readonly count: Signal<number> = computed(() => this.statusState().count);

  isActivePost(id: string) {
    console.log('isActivePost called with id ', id);
    return this.editing()?.id === id;
  }

  deletePost(id: string) {
    this.setLoading();
    const currentPosts = this.posts();
    console.log('in deletePost, trying to delete: %o', id);
    console.log('posts pre delete: %o', currentPosts);

    this.http.delete<{ message: string; count: number }>(`${BASE_URL}/posts/${id}`).subscribe({
      next: (response) => {
        console.log(response.message);

        const newPosts = currentPosts?.filter((p) => p.id !== id);
        console.log('posts post delete: %o', currentPosts);

        this.statusState.update((state) => ({
          ...state,
          data: [...(newPosts ?? [])],
          loading: false,
          count: response.count,
        }));
      },
      error: (err) => {
        console.error('deletePost error: ', err);
      },
      complete: () => {
        console.log('delete complete');
        // this.getPostsCount();
      },
    });
  }

  setEditById(id: string) {
    console.log('setEditById - call');
    this.setLoading();
    const post = this.posts().find((p) => p.id === id);
    // optimistic
    if (post) {
      console.log('setEdit: ', post.id);
      this.setEdit(post);
    } else {
      console.log('optimistic failed');
    }
    this.http.get<{ message: string; post: Post }>(`${BASE_URL}/posts/${id}`).subscribe({
      next: (response) => {
        console.log('response from getPostById: %o', response);
        const postData = response.post;
        const author = this.authService.user()?.id;
        if (!author) {
          throw Error('No author logged in');
        }
        const newPost: Post = {
          id: postData.id,
          title: postData.title,
          content: postData.content,
          imagePath: postData.imagePath,
          author: postData.author,
        };
        this.setEdit(newPost);
        console.log('setEdit: ', newPost.id);
      },
      error: (err) => {
        console.error('setEditById error: ', err);
      },
    });
  }

  setEdit(post: Post) {
    console.log('setEdit post: ', post);
    this.statusState.update((state) => ({
      ...state,
      editing: post,
      loading: false,
    }));
  }

  updatePost(id: string, title: string, content: string, image: File | string) {
    console.log('in PostService - updatePost');

    if (this.editing() == null) {
      console.log('No post selected for editing');
      return;
    }

    const postData = new FormData();
    postData.append('id', id);
    postData.append('title', title);
    postData.append('content', content);
    postData.append('image', image);

    console.log('   - making patch call to api');

    this.setLoading();
    this.http
      .patch<{
        message: string;
        post: Post;
      }>(`${BASE_URL}/posts/${id}`, postData)
      .subscribe({
        next: (response) => {
          if (response.message) {
            console.log('   - log from patching post: ', response.message);
            console.log('   - post from patch: ', response.post);

            const newPost: Post = {
              id: response.post.id,
              title: response.post.title,
              content: response.post.content,
              imagePath: response.post.imagePath,
              author: response.post.author,
            };

            let postsToSplice = [...this.posts()];
            const updateIndex = postsToSplice.findIndex((p) => p.id === id);
            const removedElements = postsToSplice.splice(updateIndex, 1, newPost);

            if (!(removedElements.length > 0)) {
              return;
            }

            this.statusState.update((state) => ({
              ...state,
              editing: null,
              data: postsToSplice,
              loading: false,
            }));
          } else {
            console.log('   - something strange happened');
          }
        },
        error: (err) => {
          console.error('updatePost error: ', err);
        },
      });
  }

  addPost(title: string, content: string, image: File) {
    this.setLoading();
    const currentPosts = this.posts();

    const postData = new FormData();
    postData.append('title', title);
    postData.append('content', content);
    postData.append('image', image);
    const author = this.authService.user()?.id;
    if (!author) {
      return;
    }
    postData.append('author', author);

    this.http
      .post<{
        message: string;
        post: Post;
        count: number;
      }>(`${BASE_URL}/posts`, postData)
      .subscribe({
        next: (response) => {
          console.log('log from adding post: ', response.message);
          if (response.post) {
            console.log('new post just in from backend ', response.post);
            const newPost: Post = {
              id: response.post.id,
              title: response.post.title,
              content: response.post.content,
              imagePath: response.post.imagePath,
              author: author,
            };
            this.statusState.update((state) => ({
              ...state,
              data: [...(currentPosts ?? []), newPost],
              loading: false,
              count: response.count,
            }));
          } else {
          }
        },
        error: (err) => {
          console.error('addPost error: ', err);
        },
        complete: () => {
          console.log('addpost complete');
        },
      });
  }

  public getPostAuthorNameOrEmail(authorId: string) {
    return this.http.get<{
      message: string;
      user: { email: string; id: string; name: string };
    }>(`${BASE_URL}/user/name/${authorId}`);
  }

  setLoading(loading: boolean = true) {
    this.statusState.update((state) => ({
      ...state,
      loading: loading,
    }));
  }
}
