import {
  cpus
} from "os";
import missions from "../missions.json"
var osmAuth = require("osm-auth");
export default {
  modules: {
    osmData: {
      strict: true,
      namespaced: true,
      state: {
        data: [],
      },
      mutations: {
        setData(state, data) {
          state.data = data
        }
      },
      actions: {
        getOSMData({
          commit
        }, boundary) {

          let south = boundary.boundary._southWest.lat
          let west = boundary.boundary._southWest.lng
          let north = boundary.boundary._northEast.lat
          let east = boundary.boundary._northEast.lng
          axios.get('/api/osmdata', {
            params: {
              south: south,
              west: west,
              north: north,
              east: east
            }
          }).then(function (response) {
            console.log(response.data)
            commit('setData', response.data)
          })
        }
      }
    },
    arboretum: {
      strict: true,
      namespaced: true,
      state: {
        species: []
      },
      mutations: {
        add(state, specie) {
          state.species.push(specie)
        },
        addMultiple(state,releves){
          for(var releve of releves){
            if(releve.specie){
              state.species.push(releve.specie)
            }
          }
        }
      }
    },
    navigator: {
      strict: true,
      namespaced: true,
      state: {
        stack: [],
        options: {}
      },
      mutations: {
        push(state, page) {
          state.stack.push(page);
        },
        pop(state) {
          if (state.stack.length > 1) {
            state.stack.pop();
          }
        },
        replace(state, page) {
          state.stack.pop();
          state.stack.push(page);
        },
        reset(state, page) {
          state.stack = [page || state.stack[0]];
        },
        options(state, newOptions = {}) {
          state.options = newOptions;
        }
      }
    },
    releve: {
      strict: true,
      namespaced: true,
      state: {
        releves: [],
        differentSpecieAdded: new Array(),
        differentGenderAdded: new Array(),
        differentSpecieChecked: new Array(),
        differentGenderChecked: new Array(),
        differentSpeciePhotographed: new Array(),
        differentGenderPhotographed: new Array(),
        mission: null,
        activite: null,
        indexActivite : 0,
        completion: 0,
        goal: 0,
        activiteEnCours : 0
      },
      mutations: {
        photoAjoutee(state, specie) {
          updateCompletion(state, "photo", specie)
        },
        setCompletion(state, completion) {
          state.completion = completion;
        },
        setGoal(state, goal) {
          state.goal = goal;
        },
        setIndexActivite(state, index) {
          state.indexActivite = index
        },
        setActivite(state, activite) {
          state.activite = activite
        },
        setMission(state, mission) {
          state.mission = mission
        },
        add(state, releve) {
          state.releves.push(releve)
          updateCompletion(state, "add", releve.specie)            
        },
        modify(state, newReleve) {
          let index = state.releves.findIndex(releve => releve._id == newReleve._id)
          if (index != -1) {
           // state.releves[index].test='truc'
            state.releves.splice(index,1,newReleve)
            state.releves[index].prev=newReleve.prev
           // updateCompletion(state, "modify/validate", state.releves[index].specie)

          }    

        },
        addMultiple(state, observations) {
          for (var observation of observations) {
            state.releves.push(observation)
          }
        },
        validate(state, currentReleve) {

          updateCompletion(state, "modify/validate", currentReleve.specie)

          let index = state.releves.findIndex(releve => releve._id == currentReleve._id)
          if (index != -1) {
            state.releves[index].validated = true
            axios.post('/api/validate', {id:currentReleve._id})

          }
        },
        delete(state) {
          if (state.releve.length > 1) {
            state.releve.pop();
          }
        },
        clearSets(state) {
          state.differentSpecieAdded.length = 0
          state.differentGenderAdded.length = 0
          state.differentSpeciePhotographed.length = 0
          state.differentGenderPhotographed.length = 0
          state.differentSpecieChecked.length = 0
          state.differentGenderChecked.length = 0
        }
      },
      actions: {
        modifyObservation({commit},newReleve){
          axios.defaults.withCredentials = true

          axios.post('/api/modifyObservation', {releve:newReleve})
          .then(function(response){
            commit('modify',response.data.observation)
          })

        },
        setObservation({
          commit
        }, releve) {
          //commit('add', releve)
          axios.defaults.withCredentials = true
          axios.post('/api/observation', {
            releve
          }).then(function (response) {
            if (response.data.observation) {
              commit('add', response.data.observation)
              if (response.data.observation.specie) {
                commit('arboretum/add', response.data.observation.specie, {
                  root: true
                })
              }
            }
          })
        }
      }   
    },

    splitter: {
      strict: true,
      namespaced: true,
      state: {
        open: false
      },
      mutations: {
        toggle(state, shouldOpen) {
          if (typeof shouldOpen === 'boolean') {
            state.open = shouldOpen;
          } else {
            state.open = !state.open;
          }
        }
      }
    },

    user: {
      strict: true,
      namespaced: true,
      state: {
        name: null,
        id: null,
      },
      mutations: {
        set(state, user) {
          state.name = user.name
          state.id = user.id
        }
      },
      actions: {
        logout({
          commit
        }) {
          var auth = osmAuth({
            oauth_secret: '9WfJnwQxDvvYagx1Ut0tZBsOZ0ZCzAvOje3u1TV0',
            oauth_consumer_key: 'WLwXbm6XFMG7WrVnE8enIF6GzyefYIN6oUJSxG65'
          });
          auth.logout();
          commit("set", {
            name: null,
            id: null
          });
        },
        loadObservation({
          commit
        }) {
          axios.get('/api/observation')
            .then(function (res) {
              commit('releve/addMultiple', res.data, {
                root: true
              })
              commit('arboretum/addMultiple', res.data, {
                root: true
              })
            })
        },
        login({
          dispatch,
          commit
        }) {
          var auth = osmAuth({
            oauth_secret: 'ycJOK6xrlW0tPXb280k1VLkH4zGlsaGyTPm4vGvr',
            oauth_consumer_key: '1zPARMhKbBJfy6lZa9Jt3SvXOM4D3bxr1s3pMly0'
          });
          auth.authenticate(function () {
            auth.xhr({
              method: 'GET',
              path: '/api/0.6/permissions'
            }, function (err, details) {
              console.log(err);
              console.log(details);
            });

            auth.xhr({
              method: 'GET',
              path: '/api/0.6/user/details'
            }, (err, res) => {
              var user = res.getElementsByTagName('user')[0]
              let userObject = {
                name: user.getAttribute('display_name'),
                id: user.getAttribute('id')
              }
              axios.defaults.withCredentials = true
              commit('set', userObject)
              return axios.get('/api/login', {
                params: {
                  id: user.getAttribute('id'),
                  name: user.getAttribute('display_name'),
                }
              }).then(function () {
                dispatch('loadObservation')
              })

            });
          }.bind(this));
        }
      }
    }

    ,

    tabbar: {
      strict: true,
      namespaced: true,
      state: {
        index: 1
      },
      mutations: {
        set(state, index) {
          state.index = index;
        }
      }
    }
  }

};


function updateCompletion(state, operation, specie) {
  switch (operation) {
    case 'add' : 
          if (!state.differentSpecieAdded.includes(specie)) {
            state.differentSpecieAdded.push(specie)
          }
          if (!state.differentGenderAdded.includes(specie.split(' ')[0])) {
            state.differentGenderAdded.push(specie.split(' ')[0])
          }
          
          if (state.activite.typeActivite == 'A1'){
            state.completion++;
          } else if (state.activite.typeActivite == 'A2' && state.activite.espece == specie){
            state.completion++;
          } else if (state.activite.typeActivite == 'A3' && specie.indexOf(state.activite.genre) == 0){
            state.completion++;
          } else if (state.activite.typeActivite == 'A4'){
            state.completion = state.differentSpecieAdded.length;
          } else if (state.activite.typeActivite == 'A5'){
            state.completion = state.differentGenderAdded.length;
          } 
     break
    case 'modify/validate' :
            if (!state.differentSpecieChecked.includes(specie)){
              state.differentSpecieChecked.push(specie)
            }
            if (! state.differentGenderChecked.includes(specie.split(' ')[0])) {
              state.differentGenderChecked.push(specie.split(' ')[0])
            }

            if (state.activite.typeActivite == 'B1'){
              state.completion++;
            } else if (state.activite.typeActivite == 'B2' && state.activite.espece == specie){
              state.completion++;
            } else if (state.activite.typeActivite == 'B3' && specie.indexOf(state.activite.genre) == 0){
              state.completion++;
            } else if (state.activite.typeActivite == 'B4'){
              state.completion = state.differentSpecieChecked.length;
            } else if (state.activite.typeActivite == 'B5'){
              state.completion = state.differentGenderChecked.length;
            }
      break
    case 'photo' :
          if (!state.differentSpeciePhotographed.includes(specie)) {
            state.differentSpeciePhotographed.push(specie)
          }
          if (!state.differentGenderPhotographed.includes(specie.split(' ')[0])) {
            state.differentGenderPhotographed.push(specie.split(' ')[0])
          }  

          if (state.activite.typeActivite == 'C1'){
            state.completion++;
          } else if (state.activite.typeActivite == 'C2' && state.activite.espece == specie){
            state.completion++;
          } else if (state.activite.typeActivite == 'C3' && specie.indexOf(state.activite.genre) == 0){
            state.completion++;
          } else if (state.activite.typeActivite == 'C4'){
            state.completion = state.differentSpeciePhotographed.length;
          } else if (state.activite.typeActivite == 'C5'){
            state.completion = state.differentGenderPhotographed.length;
          }
      break
  }

  if (state.completion == state.goal) {          
    state.activiteEnCours++;
  }
}


