import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {LoginComponent} from './auth/login/login.component';
import {RegisterComponent} from './auth/register/register.component';
import {IndexComponent} from './layout/index/index.component';
import {AuthGuardService} from './helper/auth-guard.service';
import {ProfileComponent} from './user/profile/profile.component';
import {UserPostsComponent} from './user/user-posts/user-posts.component';
import {AddPostComponent} from './user/add-post/add-post.component';
import { LandingPageComponent } from './layout/landing-page/landing-page.component';
import {MapComponent} from './layout/map/map.component';
import { AllEventsMapComponent } from './layout/all-events-map/all-events-map.component';

const routes: Routes = [
  {path: 'landpage', component: LandingPageComponent},
  {path: 'login', component: LoginComponent},
  {path: 'register', component: RegisterComponent},
  {path: 'main', component: IndexComponent, canActivate: [AuthGuardService]},
  {
    path: 'profile', component: ProfileComponent, canActivate: [AuthGuardService], children: [
      {path: '', component: UserPostsComponent, canActivate: [AuthGuardService]},
      {path: 'add', component: AddPostComponent, canActivate: [AuthGuardService]}
    ]
  },
  {path: 'add', component: AddPostComponent},
  {path: 'map', component: MapComponent},
  {path: 'allmap', component: AllEventsMapComponent},
  {path: '', redirectTo: 'landpage', pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
