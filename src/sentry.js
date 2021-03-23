const request = require("request-promise-native");

exports.getProjects = function () {
  const url =
    "https://sentry.io/api/0/organizations/" +
    process.env.SENTRY_ORG +
    "/projects/";
  const options = {
    url: url,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + process.env.SENTRY_TOKEN,
    },
  };
  let projectMap = {};

  return request(options)
    .then(function (body) {
      const projects = JSON.parse(body);

      for (let i = 0; i < projects.length; i++) {
        projectMap[projects[i].id] = projects[i].name;
      }

      return projectMap;
    })
    .catch(function (error) {
      console.log("code:", error.statusCode);
      console.log("body:", error.response.body);
    });
};

exports.getEvents = function (since) {
  const url =
    "https://sentry.io/api/0/organizations/" +
    process.env.SENTRY_ORG +
    "/stats/?stat=received&resolution=1d&group=project";
  const options = {
    url: url + "&since=" + since,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + process.env.SENTRY_TOKEN,
    },
  };

  return request(options)
    .then(function (body) {
      return JSON.parse(body);
    })
    .catch(function (error) {
      console.log("code:", error.statusCode);
      console.log("body:", error.response.body);
    });
};

exports.listProjectEvents = function (projectId) {
  const url =
    "https://sentry.io/api/0/projects/" +
    process.env.SENTRY_ORG +
    "/" +
    projectId +
    "/events";
  const options = {
    url: url,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + process.env.SENTRY_TOKEN,
    },
  };

  return request(options)
    .then(function (body) {
      return JSON.parse(body);
    })
    .catch(function (error) {
      console.log("code:", error.statusCode);
      console.log("body:", error.response.body);
    });
};



exports.getListEventsPerProject = function () {
  return that.getProjects().then(function (projects) {
    const prejectKeyArray = Object.keys(projects).map((projectId) => projectId);
    return Promise.all(
      projectKeyArray.map((projectId) => that.listProjectEvents(projectId))
    ).then((response) => {
      res = {};
      const databoxArray = [];
      prejectKeyArray.forEach((projectId, key) => {
        const events = response[key];
        const projectName = projects[projectId];
        
        databoxArray.push({
          data: events.map(event => ({
            date: event.dateCreated,
            "event.type": event["event.type"],
            title: event.title,
            serial: event.tags.find(tag => tag.key === 'serial')?.value,
            organization_id: event.tags.find(tag => tag.key === 'organization.id')?.value,
          })),
          date: date,
          key: "errors",
          attributes: {
            project: projectName,
          },
        });
      });
    });
  });
};

exports.getEventsPerProject = function (since) {
  that = this;
  return that
    .getProjects()
    .then(function (projects) {
      return that.getEvents(since).then(function (events) {
        return [projects, events];
      });
    })
    .then(function (response) {
      const projects = response[0];
      const events = response[1];
      console.log({ events, projects });
      // extract project name, date and events count and prepare structure
      // {
      //    "project name": {
      //      "date1": 12,
      //      "date2": 22,
      //      ///
      //    },
      //    "project name 2": {...}
      // }
      res = {};
      for (let projectId in events) {
        const projectName = projects[projectId];
        for (let i = 0; i < events[projectId].length; i++) {
          if (res[projectName] === undefined) {
            res[projectName] = {};
          }

          const date = new Date(events[projectId][i][0] * 1000).toUTCString();
          res[projectName][date] = events[projectId][i][1];
        }
      }

      return res;
    });
};
