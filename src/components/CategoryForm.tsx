import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Category } from '@/types';

type CategoryFormValues = {
  name: string;
  icon: string;
  type: string; // Use string for form, convert to number on submit
};

interface CategoryFormProps {
  onSubmit: (values: CategoryFormValues) => void;
  onCancel: () => void;
  defaultValues?: Category;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ onSubmit, onCancel, defaultValues }) => {
  const { t } = useTranslation();
  const { register, handleSubmit, control, formState: { errors } } = useForm<CategoryFormValues>({
    defaultValues: {
      name: defaultValues?.name || '',
      icon: defaultValues?.icon || '',
      type: defaultValues?.type?.toString() || '1',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">{t('name')}</Label>
        <Input
          id="name"
          {...register('name', { required: 'Name is required' })}
          placeholder={t('category_name_placeholder')}
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="icon">{t('icon')}</Label>
        <Input
          id="icon"
          {...register('icon', { required: 'Icon is required' })}
          placeholder="e.g. 💰, 🍔"
        />
        {errors.icon && <p className="text-red-500 text-sm mt-1">{errors.icon.message}</p>}
      </div>
      <div>
        <Label htmlFor="type">{t('type')}</Label>
        <Controller
            name="type"
            control={control}
            render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                        <SelectValue placeholder={t('type')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0">{t('income')}</SelectItem>
                        <SelectItem value="1">{t('expense')}</SelectItem>
                    </SelectContent>
                </Select>
            )}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button type="submit">{t('save')}</Button>
      </div>
    </form>
  );
};

export default CategoryForm;
