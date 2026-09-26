import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const registerAction = useAuthStore((s) => s.register);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    try {
      const res = await registerAction(data);
      toast.success(`Welcome, ${res.user.name}! Your account is ready.`);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-heading font-extrabold text-primary-text">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-secondary-text">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent hover:text-accent-hover transition-colors">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-card-border">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                Full Name
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('name')}
                  type="text"
                  className={`w-full p-3 bg-background border rounded-xl outline-none transition-all duration-300 focus:ring-2 focus:ring-accent/20 text-primary-text ${
                    errors.name ? 'border-red-300 focus:border-red-500' : 'border-card-border focus:border-accent'
                  }`}
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                Email address
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('email')}
                  type="email"
                  className={`w-full p-3 bg-background border rounded-xl outline-none transition-all duration-300 focus:ring-2 focus:ring-accent/20 text-primary-text ${
                    errors.email ? 'border-red-300 focus:border-red-500' : 'border-card-border focus:border-accent'
                  }`}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-text mb-2">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password')}
                  type={showPassword ? "text" : "password"}
                  className={`w-full p-3 pr-10 bg-background border rounded-xl outline-none transition-all duration-300 focus:ring-2 focus:ring-accent/20 text-primary-text ${
                    errors.password ? 'border-red-300 focus:border-red-500' : 'border-card-border focus:border-accent'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-text hover:text-primary-text"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-accent hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Sign up'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
