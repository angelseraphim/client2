import { Component, OnInit, OnDestroy } from '@angular/core';
import { Post } from '../../models/Post';
import { PostService } from '../../service/post.service';
import { ImageUploadService } from '../../service/image-upload.service';
import { CommentService } from '../../service/comment.service';
import { NotificationService } from '../../service/notification.service';
import { Router } from '@angular/router';
import { UserService } from '../../service/user.service';

declare var DG: any;

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css']
})
export class IndexComponent implements OnInit, OnDestroy {

  isPostsLoaded = false;
  isUserDataLoaded = false;
  posts: Post[] = [];
  user: any;

  constructor(
    private postService: PostService,
    private imageService: ImageUploadService,
    private commentService: CommentService,
    private notificationService: NotificationService,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    const script = document.createElement('script');
    script.src = 'https://maps.api.2gis.ru/2.0/loader.js?pkg=full';
    document.body.appendChild(script);

    script.onload = () => {
      this.postService.getAllPosts().subscribe(data => {
        this.posts = data;
        this.getCommentsToPosts(this.posts);
        this.isPostsLoaded = true;
        this.initializeMaps();
      });

      // Загружаем данные пользователя
      this.userService.getCurrentUser().subscribe(data => {
        this.user = data;
        this.isUserDataLoaded = true;
      });
    };
  }

  addEvent(): void {
    console.log('Add Event button clicked!');
    this.router.navigate(['/add']);
  }

  showEventsMap(): void {
    console.log('Events Map button clicked!');
    this.router.navigate(['/allmap']);
  }

  initializeMaps(): void {
    this.posts.forEach((post, index) => {
      if (post.location) {
        const coords = post.location.split(',').map(coord => parseFloat(coord.trim()));
        const latitude = coords[0];
        const longitude = coords[1];

        if (latitude && longitude) {
          const mapId = 'map-' + index;
          DG.then(() => {
            const map = DG.map(mapId, {
              center: [latitude, longitude],
              zoom: 13
            });

            DG.marker([latitude, longitude])
              .addTo(map)
              .bindPopup(`Location: ${post.location}`);
          });
        }
      }
    });
  }

  // getImagesToPosts(posts: Post[]): void {
  //   posts.forEach(p => {
  //     this.imageService.getImageToPost(p.id).subscribe(data => {
  //       p.image = data.imageBytes;
  //     });
  //   });
  // }

  getCommentsToPosts(posts: Post[]): void {
    posts.forEach(p => {
      this.commentService.getCommentsToPost(p.id).subscribe(data => {
        p.comments = data;
      });
    });
  }

  removePost(post: Post, index: number): void {
    const result = confirm('Do you really want to delete this event?');
    if (result) {
      this.postService.deletePost(post.id)
        .subscribe(() => {
          this.posts.splice(index, 1);
          this.notificationService.showSnackBar('Event deleted');
        });
    }
  }

  formatImage(img: any): any {
    if (img == null) {
      return null;
    }
    return 'data:image/jpeg;base64,' + img;
  }

  deleteComment(commentId: number, postIndex: number, commentIndex: number): void {
    const post = this.posts[postIndex];
    this.commentService.deleteComment(commentId)
      .subscribe(() => {
        this.notificationService.showSnackBar('Comment removed');
        post.comments.splice(commentIndex, 1);
      });
  }

  postComment(message: string, postId: number, postIndex: number): void {
    if (!message.trim()) {
      return;
    }
  
    this.commentService.addToCommentToPost(postId, message).subscribe((newComment) => {
      this.posts[postIndex].comments.push(newComment);
      this.notificationService.showSnackBar('Comment added');
    });
  }

  likePost(postId: number, index: number): void {
    const userHasLiked = this.posts[index].usersLiked.includes(this.user.username);
  
    if (userHasLiked) {
      this.postService.likePost(postId, this.user.username).subscribe(() => {
        this.posts[index].usersLiked = this.posts[index].usersLiked.filter(
          (username: string) => username !== this.user.username
        );
        this.notificationService.showSnackBar('Like removed');
      });
    } else {
      this.postService.likePost(postId, this.user.username).subscribe(() => {
        this.posts[index].usersLiked.push(this.user.username);
        this.notificationService.showSnackBar('Post liked');
      });
    }
  }  

  ngOnDestroy() {
    if (this.posts && this.posts.length > 0) {
      this.posts.forEach((_, index) => {
        const mapId = 'map-' + index;
        const mapElement = document.getElementById(mapId);
        if (mapElement) {
          mapElement.innerHTML = '';
        }
      });
    }
  }
}