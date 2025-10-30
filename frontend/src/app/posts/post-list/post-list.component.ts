import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';

import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
} from '@angular/material/expansion';
import { PostsService } from '../posts.service';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { PostListElementComponent } from './post-list-element/post-list-element.component';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

// as const to create a tuple of literal types
// const allowedPageSizes = [5, 10, 25] as const;
// extract the literal types from the tuple created
// type PageSizeOption = typeof allowedPageSizes[number];

@Component({
  selector: 'app-post-list',
  imports: [
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatInputModule,
    PostListElementComponent,
    MatProgressSpinner,
    MatPaginatorModule,
  ],
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostListComponent implements OnInit {
  private postsService = inject(PostsService);

  public posts = this.postsService.posts;
  public loading = this.postsService.loading;
  public postsCount = this.postsService.count;

  public hasPosts = computed(() => this.posts().length > 0);

  public postsPerPageOptions = [1, 5, 10, 25];
  public postsPerPage: (typeof this.postsPerPageOptions)[number] = 5;
  public pageIndex = 0;

  ngOnInit(): void {
    console.log('PostListComponent OnInit');
    this.postsService.getPosts(this.postsPerPage, this.pageIndex + 1);
  }

  onPageChange(e: PageEvent) {
    console.log('onPageChange');
    this.pageIndex = e.pageIndex;
    this.postsPerPage = e.pageSize;
    this.postsService.getPosts(this.postsPerPage, this.pageIndex + 1);
  }
}
