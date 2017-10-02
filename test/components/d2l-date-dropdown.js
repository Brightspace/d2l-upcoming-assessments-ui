/* global describe, it, fixture, expect, beforeEach */

'use strict';

describe('<d2l-date-dropdown>', function() {
	var elem;

	beforeEach(function() {
		elem = fixture('basic');
	});

	describe('smoke test', function() {
		it('should instantiate the element', function() {
			expect(elem.is).to.equal('d2l-date-dropdown');
		});
	});
	describe('value', function() {
		describe('value tests', function() {
			it('should default value to empty', function() {
				expect(elem.value).to.be.empty;
				expect(elem.hasAttribute('value')).to.be.true;
			});
			it('should set property when setting attribute', function() {
				elem.setAttribute('value', '2017-07-01');
				expect(elem.value).to.equal('2017-07-01');
			});
			it('should set attribute when setting value', function() {
				elem.value = '2017-07-01';
				expect(elem.getAttribute('value')).to.equal('2017-07-01');
			});
			it('should set vaadin picker when element value set', function() {
				elem.value = '2017-06-01';
				expect(elem.$$('vaadin-date-picker-light').value).to.equal('2017-06-01');
			});
			it('should set element value when vaadin picker value set', function() {
				elem.$$('vaadin-date-picker-light').value = '2017-07-01';
				expect(elem.value).to.equal('2017-07-01');
			});
		});
		describe('value-change-event', function() {
			it('should fire d2l-date-dropdown-value-changed event when element is changed', function(done) {
				elem.addEventListener('d2l-date-dropdown-value-changed', function(e) {
					expect(e.target).to.equal(elem);
					done();
				});
				elem.value = '2017-07-01';
			});
			it('should send date when element is changed', function(done) {
				var date = new Date(2017, 6, 1);
				elem.addEventListener('d2l-date-dropdown-value-changed', function(e) {
					expect(e.detail.date).to.deep.equal(date);
					done();
				});
				elem.value = '2017-07-01';
			});
		});
	});

	describe('pointer visibility', function() {
		it('should show the pointer when screen not small and iron-overlay-opened', function() {
			elem._smallScreen = false;
			elem._opened = true;
			expect(elem.$$('.d2l-dropdown-content-pointer').style.opacity).to.equal('1');
		});

		it('should not show the pointer when screen not small and iron-overlay-closed', function() {
			elem._smallScreen = false;
			elem._opened = false;
			expect(elem.$$('.d2l-dropdown-content-pointer').style.opacity).to.equal('0');
		});

		it('should not show the pointer when screen small and iron-overlay-opened', function() {
			elem._smallScreen = true;
			elem._opened = true;
			expect(elem.$$('.d2l-dropdown-content-pointer').style.opacity).to.equal('0');
		});

		it('should not show the pointer when screen small and iron-overlay-closed', function() {
			elem._smallScreen = false;
			elem._opened = false;
			expect(elem.$$('.d2l-dropdown-content-pointer').style.opacity).to.equal('0');
		});
	});
});
