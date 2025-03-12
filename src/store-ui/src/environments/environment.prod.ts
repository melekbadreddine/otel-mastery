const IP = '192.168.58.2';

export const environment = {
  production: true,
  apiUrls: {
    productCatalog: `http://${IP}:31201`,
    shoppingCart: `http://${IP}:31202`,
    orderProcessing: `http://${IP}:31203`,
    inventoryManagement: `http://${IP}:31204`
  },
  websocketUrl: `ws://${IP}:31200`
};