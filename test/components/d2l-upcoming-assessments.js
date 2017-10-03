/* global describe, it, fixture, expect, beforeEach, afterEach, sinon */

'use strict';

describe('<d2l-upcoming-assessments>', function() {

	var element;
	var periodUrl = '/some/period/now/';
	var activities = {
		properties: {
			start: '2017-07-19T16:20:07.567Z',
			end: '2017-08-02T16:20:07.567Z'
		}
	};

	beforeEach(function() {
		element = fixture('basic');
	});

	describe('smoke test', function() {

		it('can be instantiated', function() {
			expect(element.is).to.equal('d2l-upcoming-assessments');
		});

	});

	describe('fetching data', function() {

		var element;
		var sandbox;
		var server;

		beforeEach(function() {
			sandbox = sinon.sandbox.create();
			server = sinon.fakeServer.create();
			server.respondImmediately = true;

			element = fixture('basic');
			element._debounceTime = 10;
		});

		afterEach(function() {
			server.restore();
			sandbox.restore();
		});

		describe('_getInfo', function() {
			var customRangeUrl, myActivities, userEntity;

			beforeEach(function() {
				customRangeUrl = 'http://example.com?start=2017-09-20T12:00:00.000Z&end=2017-09-27T12:00:00.000Z';
				myActivities = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
				userEntity = window.D2L.Hypermedia.Siren.Parse({
					entities: [{
						rel: ['https://api.brightspace.com/rels/first-name'],
						properties: {
							name: 'foo'
						}
					}],
					links: [{
						rel: ['https://activities.api.brightspace.com/rels/my-activities'],
						href: 'http://example.com/my-activities'
					}]
				});

				element.isActivityUpcoming = sinon.stub().returns(true);
				element._fetchEntity = sinon.stub().returns(Promise.resolve(userEntity));
				element._getCustomRangeAction = sinon.stub().returns(Promise.resolve(customRangeUrl));
				element._loadActivitiesForPeriod = sinon.stub().returns(Promise.resolve(myActivities));
			});

			it('should reset the error state', function() {
				element._showError = true;

				return element._getInfo().then(function() {
					expect(element._showError).to.be.false;
				});
			});

			it('should fetch the user entity', function() {
				element.userUrl = 'http://example.com';

				return element._getInfo().then(function() {
					expect(element._fetchEntity).to.have.been.calledWith('http://example.com');
				});
			});

			it('should set the user\'s name', function() {
				return element._getInfo().then(function() {
					expect(element._userName).to.equal('foo');
				});
			});

			it('should fetch activities with a custom date range', function() {
				return element._getInfo().then(function() {
					expect(element._getCustomRangeAction).to.have.been.calledWith('http://example.com/my-activities');
				});
			});

			it('should set the total number of activities', function() {
				return element._getInfo().then(function() {
					expect(element.totalCount).to.equal(5);
				});
			});

			it('should set the stored assessments to be the first four activities', function() {
				return element._getInfo().then(function() {
					expect(element._assessments.length).to.equal(4);
				});
			});

			it('should set the error state if things go wrong', function() {
				element._loadActivitiesForPeriod = sinon.stub().returns(Promise.reject());

				return element._getInfo().then(function() {
					expect(element._showError).to.be.true;
				});
			});
		});

		describe('_getCustomDateRangeParameters', function() {
			it('gets the correct range when selected date is a Tuesday', function() {
				var date = new Date('Tue Sep 12 2017 00:00:00');
				var expected = {
					start: 'Sept 10 2017 00:00:00',
					end: 'Sept 23 2017 23:59:59'
				};
				var range = element._getCustomDateRangeParameters(date);

				var start = new Date(expected.start).toISOString();
				var endDate = new Date(expected.end);
				endDate.setMilliseconds(999);
				var end = endDate.toISOString();

				expect(range.start).to.equal(start);
				expect(range.end).to.equal(end);
			});

			it('gets the correct range when selected date is a Sunday', function() {
				var date = new Date('Sun Sep 03 2017 00:00:00');
				var expected = {
					'start':'Sept 3 2017 00:00:00',
					'end':'Sept 16 2017 23:59:59'
				};
				var range = element._getCustomDateRangeParameters(date);

				var start = new Date(expected.start).toISOString();
				var endDate = new Date(expected.end);
				endDate.setMilliseconds(999);
				var end = endDate.toISOString();

				expect(range.start).to.equal(start);
				expect(range.end).to.equal(end);
			});

			it('gets the correct range when selected date is a Saturday', function() {
				var date = new Date('Sat Aug 26 2017 00:00:00');
				var expected = {
					'start':'Aug 20 2017 00:00:00',
					'end':'Sept 2 2017 23:59:59'
				};

				var range = element._getCustomDateRangeParameters(date);

				var start = new Date(expected.start).toISOString();
				var endDate = new Date(expected.end);
				endDate.setMilliseconds(999);
				var end = endDate.toISOString();

				expect(range.start).to.equal(start);
				expect(range.end).to.equal(end);
			});
		});

		describe('_onDateValueChanged', function() {
			it('invokes _loadActivitiesForPeriod with the correct url', function() {
				element._loadActivitiesForPeriod = sandbox.stub().returns(Promise.resolve());
				element._selectCustomDateRangeAction = {
					href: 'http://www.foo.com',
					fields: [{
						name:'start',
						type:'text',
						value:'2017-09-26T19:14:21.889Z'
					}, {
						name:'end',
						type:'text',
						value:'2017-10-03T19:14:21.889Z'
					}]
				};
				var date = new Date('Tue Sep 05 2017 00:00:00');
				var dateObj = {
					detail: {
						date: date
					}
				};

				var expected = {
					'start': 'Sept 3 2017 00:00:00',
					'end': 'Sept 16 2017 23:59:59'
				};

				var start = new Date(expected.start).toISOString();
				var endDate = new Date(expected.end);
				endDate.setMilliseconds(999);
				var end = endDate.toISOString();

				var expectedUrl = 'http://www.foo.com?start=' + start + '&end=' + end;
				return element._onDateValueChanged(dateObj)
					.then(function() {
						expect(element._loadActivitiesForPeriod).to.have.been.calledWith(expectedUrl);
					});
			});
		});

		describe('_loadActivitiesForPeriod', function() {

			it('does nothing if the provided url was not set', function() {
				element._fetchEntity = sandbox.stub();
				return element._loadActivitiesForPeriod()
					.then(function() {
						return Promise.reject('Expected _loadActivitiesForPeriod to reject');
					})
					.catch(function() {
						expect(element._fetchEntity).to.not.have.been.called;
					});
			});

			it('calls _fetchEntity for the provided url', function() {
				element._fetchEntity = sandbox.stub().returns(Promise.resolve(
					window.D2L.Hypermedia.Siren.Parse(activities)
				));
				return element._loadActivitiesForPeriod(periodUrl)
					.then(function() {
						expect(element._fetchEntity).to.have.been.calledWith(periodUrl);
					});
			});

			it('should update the allActivies with the activities in the period', function() {
				var userUsage = {};
				userUsage.getLinkByRel = sandbox.stub().returns();
				userUsage.properties = {
					start: 'start',
					end: 'end'
				};

				element._getFormattedPeriodText = sandbox.stub().returns('dateText');

				element._fetchEntity = sandbox.stub().returns(Promise.resolve(userUsage));
				element._getOverdueActivities = sandbox.stub().returns(activities);
				element._getUserActivityUsagesInfos = sandbox.stub().returns(activities);
				element._updateActivitiesInfo = sandbox.stub().returns(activities);
				return element._loadActivitiesForPeriod(nextPeriodUrl)
					.then(function() {
						expect(element._allActivities).to.equal(activities);
					});
			});

			it('should not update the assessments with the activities in the period', function() {
				var userUsage = {};
				userUsage.getLinkByRel = sandbox.stub().returns();
				userUsage.properties = {
					start: 'start',
					end: 'end'
				};

				element._getFormattedPeriodText = sandbox.stub().returns('dateText');

				element._fetchEntity = sandbox.stub().returns(Promise.resolve(userUsage));
				element._getOverdueActivities = sandbox.stub().returns(activities);
				element._getUserActivityUsagesInfos = sandbox.stub().returns(activities);
				element._updateActivitiesInfo = sandbox.stub().returns(activities);
				return element._loadActivitiesForPeriod(nextPeriodUrl)
					.then(function() {
						expect(element._assessments).to.not.equal(activities);
					});
			});

		});

		describe('_getInfo', function() {
			it('should set the assessments', function() {
				var userUsage = {};
				userUsage.getSubEntityByRel = sandbox.stub().returns();
				userUsage.getLinkByRel = sandbox.stub().returns();

				element._fetchEntity = sandbox.stub().returns(Promise.resolve(userUsage));
				element._getCustomRangeAction = sandbox.stub().returns(Promise.resolve(userUsage));

				element._loadActivitiesForPeriod = sandbox.stub().returns(Promise.resolve([1, 2, 3]));

				element.isActivityUpcoming = sandbox.stub().returns(true);

				return element._getInfo()
				.then(function() {
					expect(element._assessments.toString()).to.equal([1, 2, 3].toString());
				});
			});

			it('should set the assessments count', function() {
				var userUsage = {};
				userUsage.getSubEntityByRel = sandbox.stub().returns();
				userUsage.getLinkByRel = sandbox.stub().returns();

				element._fetchEntity = sandbox.stub().returns(Promise.resolve(userUsage));
				element._getCustomRangeAction = sandbox.stub().returns(Promise.resolve(userUsage));

				element._loadActivitiesForPeriod = sandbox.stub().returns(Promise.resolve([1, 2, 3]));

				element.isActivityUpcoming = sandbox.stub().returns(true);

				return element._getInfo()
				.then(function() {
					expect(element.totalCount).to.equal(3);
				});
			});

			it('should truncate the assessments at 4', function() {
				var userUsage = {};
				userUsage.getSubEntityByRel = sandbox.stub().returns();
				userUsage.getLinkByRel = sandbox.stub().returns();

				element._fetchEntity = sandbox.stub().returns(Promise.resolve(userUsage));
				element._getCustomRangeAction = sandbox.stub().returns(Promise.resolve(userUsage));

				element._loadActivitiesForPeriod = sandbox.stub().returns(Promise.resolve([1, 2, 3, 4, 5, 6]));

				element.isActivityUpcoming = sandbox.stub().returns(true);

				return element._getInfo()
				.then(function() {
					expect(element._assessments.toString()).to.equal([1, 2, 3, 4].toString());
				});
			});
		});

		describe('_getCustomRangeAction', function() {
			it('does nothing if the provided url was not set', function() {
				element._fetchEntity = sandbox.stub();
				return element._getCustomRangeAction()
					.then(function() {
						return Promise.reject('Expected _getCustomRangeAction to reject');
					})
					.catch(function() {
						expect(element._fetchEntity).to.not.have.been.called;
					});
			});

			it('calls _fetchEntity for the provided url', function() {
				element._fetchEntity = sandbox.stub().returns(Promise.resolve(
					window.D2L.Hypermedia.Siren.Parse(activities)
				));
				return element._getCustomRangeAction(periodUrl)
					.then(function() {
						expect(element._fetchEntity).to.have.been.calledWith(periodUrl);
					});
			});
		});

	});

});
