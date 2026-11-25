import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CrmModuleRouteComponent } from './core/crm-module-route.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'leads/:leadId', component: CrmModuleRouteComponent },
  { path: ':module', component: CrmModuleRouteComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: false })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
