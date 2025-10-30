import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import {
  MatExpansionPanel,
  MatExpansionPanelActionRow,
  MatExpansionPanelHeader,
} from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { Post } from '../../post.model';
import { PostsService } from '../../posts.service';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { MatExpansionPanelTitle } from '@angular/material/expansion';

@Component({
  imports: [
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelActionRow,
    MatExpansionPanelTitle,
    MatButtonModule,
    RouterLink,
  ],
  styleUrls: ['./post-list-element.component.css'],
  selector: 'post-list-element',
  templateUrl: './post-list-element.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostListElementComponent {
  private postsService = inject(PostsService);
  private authService = inject(AuthService);

  public post = input.required<Post>();

  // public isActive: boolean = false;

  public isAuthenticated = computed(() => {
    if (this.authService.isAuthenticated()) {
      return true;
    }
    return false;
  });

  public isAuthor = computed(() => {
    if (this.authService.isAuthor(this.post().author ?? '')) {
      return true;
    }
    return false;
  });

  public isActivePost = computed(() => {
    if (this.postsService.isActivePost(this.post().id)) {
      return true;
    }
    return false;
  });

  public postAuthor = signal<string>('Unknown');

  getPostAuthor() {
    if (this.postAuthor() !== 'Unknown') return;
    console.log('getPostAuthor');
    this.postsService.getPostAuthorNameOrEmail(this.post().author).subscribe({
      next: (response) => {
        if (response.user.name) {
          this.postAuthor.set(response.user.name);
        } else {
          this.postAuthor.set(response.user.email);
        }
      },
      error: (err) => {
        console.error('getPostAuthor error: ', err);
        this.postAuthor.set('Unknown');
      },
    });
  }

  onDelete() {
    console.log('delete %o', this.post().id);
    this.postsService.deletePost(this.post().id);
  }
}
