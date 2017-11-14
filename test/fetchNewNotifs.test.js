const fetchNewNotifs = require('../src/options/containers/notifications/polling/fetchNewNotifs');
// import db from '../src/pouchdb'

beforeEach(function() {

  global.fetch = jest.fn().mockImplementation(() => {
      var p = new Promise((resolve, reject) => {
        resolve({
          ok: true, 
          Id: '123', 
          json: function() { 
            return {Id: '123'}
          }
        });
      });

      return p;
  });

});


it("responds with an object", async function() {
  const response = await fetchNewNotifs();
  console.log(response);
  expect(response.Id).toBe(1); 
});