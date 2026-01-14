import CategorySettings from "./CategorySettings";
import RecurringSettings from "./RecurringSettings";
import DbSettings from "./dbSettings";

const SettingsPage = () => {
  return (
    <>
      <DbSettings />
      <CategorySettings />
      <RecurringSettings />
    </>
  );
};

export default SettingsPage;
