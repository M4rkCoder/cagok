const fs = require('fs');
const path = require('path');

const mapping = {
  "description": "common.description",
  "description_required": "validation.description_required",
  "transaction_description_placeholder": "transaction.description_placeholder",
  "amount": "common.amount",
  "amount_required": "validation.amount_required",
  "date": "common.date",
  "date_required": "validation.date_required",
  "type": "common.type",
  "select_type": "transaction.select_type",
  "select_month": "common.select_month",
  "transaction_type": "transaction.type_label",
  "select_transaction_type": "transaction.select_type_label",
  "remarks": "common.remarks",
  "optional_memo_note": "transaction.optional_memo_note",
  "category": "common.category",
  "select_category": "transaction.select_category",
  "no_category": "transaction.no_category",
  "select_icon": "category.select_icon",
  "search_category": "category.search",
  "no_results": "common.no_results",
  "edit_name": "category.edit_name",
  "new_name": "category.new_name",
  "add_new_category": "category.add_new",
  "category_name_empty": "validation.category_name_empty",
  "transactions": "transaction.title",
  "new_transaction": "transaction.new",
  "edit_transaction": "transaction.edit",
  "create_new_transaction": "transaction.create_new",
  "loading": "common.loading",
  "no_results_found": "common.no_results_found",
  "no_transactions_found": "transaction.no_found",
  "actions": "common.actions",
  "failed_to_fetch_transactions": "toast.fetch_transactions_failed",
  "failed_to_fetch_categories": "toast.fetch_categories_failed",
  "transaction_deleted_successfully": "toast.transaction_deleted",
  "failed_to_delete_transaction": "toast.delete_transaction_failed",
  "transaction_updated_successfully": "toast.transaction_updated",
  "transaction_created_successfully": "toast.transaction_created",
  "failed_to_save_transaction": "toast.save_transaction_failed",
  "confirm_delete": "dialog.confirm_delete",
  "confirm_delete_transaction_message": "dialog.delete_transaction_message",
  "bulk_delete_title": "dialog.bulk_delete_title",
  "bulk_delete_confirm": "dialog.bulk_delete_confirm",
  "filter_by_type": "filter.by_type",
  "all_types": "filter.all_types",
  "filter_by_category": "filter.by_category",
  "all_categories": "filter.all_categories",
  "search_transactions": "filter.search_transactions",
  "pick_start_date": "filter.pick_start_date",
  "pick_end_date": "filter.pick_end_date",
  "period_preset": "filter.period_preset",
  "1_month": "filter.periods.1_month",
  "3_months": "filter.periods.3_months",
  "6_months": "filter.periods.6_months",
  "1_year": "filter.periods.1_year",
  "all_time": "filter.periods.all_time",
  "recurring_notification": "notification.recurring_created",
  "income": "common.income",
  "expense": "common.expense",
  "fixed_expesne": "common.fixed_expense"
};

function processDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.match(/\.(ts|tsx)$/)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      const keysToReplace = Object.keys(mapping);
      keysToReplace.forEach(oldKey => {
        // match t("oldKey") or t('oldKey') or i18n.t("oldKey")
        // Since we are replacing t("...", we can use \b as boundaries for t or i18n.t
        const regex = new RegExp(`(t|i18n\\.t)\\(\\s*(['"])${oldKey}(['"])`, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, `$1($2${mapping[oldKey]}$3`);
          changed = true;
        }
      });

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated translations in ${fullPath}`);
      }
    }
  });
}

processDir('src');
