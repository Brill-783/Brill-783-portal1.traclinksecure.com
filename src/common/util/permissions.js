import { useSelector } from 'react-redux';

export const useAdministrator = () => {
  const user = useSelector((state) => state.session?.user);
  const impersonating = useSelector((state) => Boolean(state.session?.user && localStorage.getItem('impersonated_user_id')));
  return Boolean(user && user.administrator && !impersonating);
};

export const useManager = () =>
  useSelector((state) => {
    const admin = Boolean(state.session?.user?.administrator || state.session?.user?.admin);
    const manager = (state.session?.user?.userLimit || 0) !== 0;
    return admin || manager;
  });

export const useDeviceReadonly = () =>
  useSelector((state) => {
    const admin = Boolean(state.session?.user?.administrator || state.session?.user?.admin);
    const serverReadonly = state.session?.server?.readonly;
    const userReadonly = state.session?.user?.readonly;
    const serverDeviceReadonly = state.session?.server?.deviceReadonly;
    const userDeviceReadonly = state.session?.user?.deviceReadonly;
    return !admin && Boolean(serverReadonly || userReadonly || serverDeviceReadonly || userDeviceReadonly);
  });

export const useRestriction = (key) =>
  useSelector((state) => {
    const admin = Boolean(state.session?.user?.administrator || state.session?.user?.admin);
    const serverValue = state.session?.server?.[key];
    const userValue = state.session?.user?.[key];
    return !admin && Boolean(serverValue || userValue);
  });