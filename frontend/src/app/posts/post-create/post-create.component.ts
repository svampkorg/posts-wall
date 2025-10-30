import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { PostsService } from '../posts.service';
import { Post } from '../post.model';
import { ActivatedRoute, Router } from '@angular/router';
import { isValidFileType } from './mime-type.validator.js';

@Component({
  selector: 'app-post-create',
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinner,
  ],
  templateUrl: './post-create.component.html',
  styleUrls: ['./post-create.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostCreateComponent implements OnInit {
  private postsService = inject(PostsService);
  private router = inject(Router);
  public activeRoute = inject(ActivatedRoute);

  public hasImageError = signal<string | null>(null);
  public imagePreview = signal<string | ArrayBuffer | null>(null);
  public formPost = signal<Partial<Post>>({
    title: '',
    content: '',
    id: undefined,
    imagePath: undefined,
  });

  private editingSignal = this.postsService.editing;
  public loading = this.postsService.loading;

  public isEditing: boolean = false;
  public buttonText = computed(() => (this.editingSignal() ? 'UPDATE' : 'SAVE'));

  form: FormGroup;

  constructor() {
    this.form = new FormGroup({
      title: new FormControl(null, {
        validators: [Validators.required, Validators.minLength(3)],
      }),
      content: new FormControl(null, {
        validators: [Validators.required],
      }),
      image: new FormControl(null, {
        validators: [
          Validators.required,
          // simpleFileTypeValidator
        ],
        // asyncValidators: [mimeType],
      }),
    });

    effect(() => {
      console.log('constructor');
      this.setEditingPost();
    });

    effect(() => {
      this.form.setValue({
        title: this.formPost().title,
        content: this.formPost().content,
        image: this.formPost().imagePath,
      });
    });
  }

  onImagePicked(event: Event) {
    // this.imagePreview.set(null);
    this.hasImageError.set(null);
    // console.log('onImagePicked');

    if (!event.target) return;
    const file = (event.target as HTMLInputElement).files?.item(0);
    if (!file) {
      this.hasImageError.set('No file selected.');
      return;
    }
    this.form.patchValue({ image: file });
    this.form.get('image')?.updateValueAndValidity();

    if (!(file instanceof Blob)) {
      this.hasImageError.set('File is not a blob!');
      console.log('File is not a blob!');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      console.log('reader.onload');
      console.log('file.type ', file.type);

      if (isValidFileType(file.type)) {
        this.imagePreview.set(reader.result);
        // this.form.patchValue({ image: this.imagePreview() });
      } else {
        this.hasImageError.set('Invalid file format. You can only pick images.');
        this.imagePreview.set(null);
        this.form.get('image')?.patchValue(null);
      }
    };

    reader.readAsDataURL(file);
  }

  ngOnInit(): void {
    this.activeRoute.paramMap.subscribe((params) => {
      console.log('active route subscription');
      const id = params.get('id');
      if (id) {
        console.log('   - id: ', id);
        this.postsService.setEditById(id);
      }
    });
  }

  setEditingPost() {
    console.log('setEditingPost');
    const editPost = this.editingSignal();
    if (editPost) {
      console.log('PostCreateComponent - setEditingPost, There is a post to edit: ', editPost);
      this.isEditing = true;
      this.formPost.set(editPost);
      if (typeof editPost.imagePath === 'string') {
        console.log('imagePath is a string');
        this.imagePreview.set(editPost.imagePath as string);
      }
    } else {
      console.log('PostCreateComponent - setEditingPost, There is no post to edit');
      this.isEditing = false;
      this.formPost.set({
        title: '',
        content: '',
        id: undefined,
        imagePath: '',
      });
    }
  }

  // updateFormPost(key: keyof Partial<Post>, value: any) {
  //   this.formPost.update((p) => ({ ...p, [key]: value }));
  // }

  clearImageSelection() {
    this.imagePreview.set(null);
    this.form.get('image')?.patchValue(null);
    this.hasImageError.set(null);
  }

  onAddPost() {
    const editingPost = this.editingSignal();
    console.log('PostCreateComponent - onAddPost, editing: %o', editingPost);

    if (this.form.invalid) {
      if (!this.form.get('image')?.value) {
        this.hasImageError.set('You must select an image to upload');
      }
      return;
    }

    if (editingPost != null) {
      // const post: Post = {
      //   id: editingPost.id,
      //   title: this.form.get('title')?.value,
      //   content: this.form.get('content')?.value,
      //   imagePath: this.form.get('image')?.value,
      // };
      // console.log('PostCreateComponent - onAddPost, updated post: ', post);
      this.postsService.updatePost(
        editingPost.id,
        this.form.get('title')?.value,
        this.form.get('content')?.value,
        this.form.get('image')?.value,
      );
    } else {
      console.log('attempting to save a new post');
      this.postsService.addPost(
        this.form.get('title')?.value,
        this.form.get('content')?.value,
        this.form.get('image')?.value,
      );
    }
    this.form.reset();
    this.router.navigateByUrl('/');
  }
}
