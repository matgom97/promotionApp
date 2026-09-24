import { Component, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        RouterLink
    ],
    templateUrl: './forgot-password.component.html',
    styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent implements OnInit {

    forgotPasswordForm!: FormGroup;

    isSubmitting = false;

    emailSent = false;

    constructor(
        private fb: FormBuilder
    ) {}

    ngOnInit(): void {

        this.forgotPasswordForm = this.fb.group({

            email: [
                '',
                [
                    Validators.required,
                    Validators.email
                ]
            ]

        });

    }

    submit(): void {

        if (this.forgotPasswordForm.invalid) {

            this.forgotPasswordForm.markAllAsTouched();

            return;
        }

        const email = this.forgotPasswordForm.value.email;

        console.log('Forgot password:', {
            email
        });

        this.isSubmitting = true;

        /*
         * Posteriormente:
         *
         * this.authService
         *     .forgotPassword(email)
         *     .subscribe(...)
         */

        this.emailSent = true;
        this.isSubmitting = false;
    }
}