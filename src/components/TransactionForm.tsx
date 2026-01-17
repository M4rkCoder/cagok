import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Category, Transaction, TransactionFormValues } from '@/types';

interface TransactionFormProps {
  onSubmit: (values: TransactionFormValues) => void;
  onCancel: () => void;
  defaultValues?: Transaction;
  categories: Category[];
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  onCancel,
  defaultValues,
  categories,
}) => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    defaultValues: {
      description: defaultValues?.description || '',
      amount: defaultValues?.amount || 0,
      date: defaultValues?.date || new Date().toISOString().split('T')[0],
      type: defaultValues?.type ?? 1,
      is_fixed: defaultValues?.is_fixed ?? 0,
      remarks: defaultValues?.remarks || '',
      category_id: defaultValues?.category_id,
    },
  });

  useEffect(() => {
    reset({
      description: defaultValues?.description || '',
      amount: defaultValues?.amount || 0,
      date: defaultValues?.date || new Date().toISOString().split('T')[0],
      type: defaultValues?.type ?? 1,
      is_fixed: defaultValues?.is_fixed ?? 0,
      remarks: defaultValues?.remarks || '',
      category_id: defaultValues?.category_id,
    });
  }, [defaultValues, reset]);

  const handleFormSubmit = (values: TransactionFormValues) => {
    onSubmit({
      ...values,
      amount: Number(values.amount),
      type: Number(values.type),
      is_fixed: Number(values.is_fixed),
      category_id: values.category_id !== '' ? Number(values.category_id) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="description">{t('description')}</Label>
        <Input
          id="description"
          {...register('description', { required: t('description_required') })}
          placeholder={t('transaction_description_placeholder')}
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">
            {errors.description.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="amount">{t('amount')}</Label>
        <Input
          id="amount"
          type="number"
          {...register('amount', {
            required: t('amount_required'),
            valueAsNumber: true,
          })}
          placeholder="0.00"
        />
        {errors.amount && (
          <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="date">{t('date')}</Label>
        <Input
          id="date"
          type="date"
          {...register('date', { required: t('date_required') })}
        />
        {errors.date && (
          <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="type">{t('type')}</Label>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select
              onValueChange={(value) => field.onChange(Number(value))}
              value={field.value?.toString()}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('select_type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t('income')}</SelectItem>
                <SelectItem value="1">{t('expense')}</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div>
        <Label htmlFor="is_fixed">{t('transaction_type')}</Label>
        <Controller
          name="is_fixed"
          control={control}
          render={({ field }) => (
            <Select
              onValueChange={(value) => field.onChange(Number(value))}
              value={field.value?.toString()}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('select_transaction_type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t('variable')}</SelectItem>
                <SelectItem value="1">{t('fixed')}</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div>
        <Label htmlFor="remarks">{t('remarks')}</Label>
        <Textarea
          id="remarks"
          {...register('remarks')}
          placeholder={t('optional_memo_note')}
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="category_id">{t('category')}</Label>
        <Controller
          name="category_id"
          control={control}
          render={({ field }) => (
            <Select
              onValueChange={(value) => field.onChange(value === 'null-category' ? undefined : Number(value))}
              value={field.value === undefined || field.value === null ? 'null-category' : field.value.toString()}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('select_category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null-category">{t('no_category')}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id?.toString() || ''}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
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

export default TransactionForm;
