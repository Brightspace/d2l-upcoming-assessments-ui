import '../../components/d2l-all-assessments';
import { expect, fixture, html } from '@open-wc/testing';
import { runConstructor } from '@brightspace-ui/core/tools/constructor-test-helper.js';

describe('<d2l-all-assessments>', function() {

	describe('constructor', () => {
		it('constructs the attribute picker component', () => {
			runConstructor('d2l-all-assessments');
		});
	});

	describe('accessibility', () => {
		it('should pass all aXe tests', async() => {
			const el = await fixture(html`<d2l-all-assessments></d2l-all-assessments>`);
			await expect(el).to.be.accessible();
		});
	});

});
