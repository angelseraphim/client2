import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Post } from '../../models/Post';
import { PostService } from '../../service/post.service';
import { ImageUploadService } from '../../service/image-upload.service';
import { NotificationService } from '../../service/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-post',
  templateUrl: './add-post.component.html',
  styleUrls: ['./add-post.component.css']
})
export class AddPostComponent implements OnInit {

  postForm: FormGroup;
  selectedFile: File | null = null;
  isPostCreated = false;
  createdPost: Post | null = null;
  previewImgURL: string | ArrayBuffer | null = null;
  selectedLocation: { lat: number; lng: number } | null = null; // Хранение выбранных координат

  constructor(
    private postService: PostService,
    private imageUploadService: ImageUploadService,
    private notificationService: NotificationService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.postForm = this.createPostForm();
  }

  createPostForm(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      caption: ['', Validators.required],
      // Удалено поле location
    });
  }

  onLocationSelected(location: { lat: number; lng: number }): void {
    this.selectedLocation = location;
    console.log('Location selected:', location);
  }

  submit(): void {
    if (this.postForm.invalid || !this.selectedLocation) {
      this.notificationService.showSnackBar('Please fill in all fields and select a location');
      return;
    }
  
    // Преобразуем координаты в строку
    const locationString = `${this.selectedLocation.lat},${this.selectedLocation.lng}`;
  
    const postPayload = {
      title: this.postForm.value.title,
      caption: this.postForm.value.caption,
      location: locationString, // Передаем строку
    };
  
    this.postService.createPost(postPayload).subscribe({
      next: (post) => {
        this.createdPost = post;
        console.log('Post created:', post);
  
        if (this.selectedFile && post.id) {
          this.imageUploadService.uploadImageToPost(this.selectedFile, post.id).subscribe({
            next: () => {
              this.notificationService.showSnackBar('Post created successfully');
              this.isPostCreated = true;
              this.router.navigate(['/profile']);
            },
            error: (err) => {
              console.error('Image upload failed:', err);
              this.notificationService.showSnackBar('Image upload failed');
            },
          });
        } else {
          this.router.navigate(['/profile']);
        }
      },
      error: (err) => {
        console.error('Post creation failed:', err);
        this.notificationService.showSnackBar('Post creation failed');
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      const reader = new FileReader();
      reader.onload = () => {
        this.previewImgURL = reader.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }
}
