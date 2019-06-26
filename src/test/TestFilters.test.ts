import {it, describe} from 'mocha'
import { is_enabled, environment_match, test_depth, in_list } from '../../testCases/TestFilters';
import { Country, Environment, Depth } from '../../testCases/ProjectConfig';
import {chk, chkFalse} from '../lib/AssertionUtils';

describe('test filters', () => {

  const baseCase = () => {
    return {
              title: 'Blah Blahh Title',
              owner: 'JW',
              enabled: true,
              countries: <any>["Australia"],
              environments: <any>["TST", "UAT"],
              depth: <any>"Regression"
            };
  }

  const baseConfig = () => {
    return {
    name: 'Test Run',
    mocked: false,
    country: <any>"Australia",
    environment: <any>"TST",
    testCases: <any[]>[],
    depth: <any>"Regression"
  }}

  it('is_enabled - pass', () => {
    chk(is_enabled('ignored', baseCase(), baseConfig()));
  });

  it('is_enabled - fail', () => {
    let bc = baseCase();
    bc.enabled = false;
    chkFalse(is_enabled('ignored', bc, baseConfig()));
  });

  it('environment_match - pass', () => {
    chk(environment_match('ignored', baseCase(), baseConfig()));
  });

  it('environment_match - fail', () => {
    let bc = baseCase();
    bc.environments = ["PVT"];
    chkFalse(environment_match('ignored', bc, baseConfig()));
  });

  it('test_depth - pass', () => {
    let bc = baseCase();
    chk(test_depth('ignored', bc, baseConfig()));
  });

  it('test_depth - fail', () => {
    let bc = baseCase();
    bc.depth = "DeepRegression";
    chkFalse(test_depth('ignored', bc, baseConfig()));
  });

  it('in_list - pass name', () => {
    let rc = baseConfig();
    rc.testCases = [120, '*He*']
    chk(in_list('Hehe', baseCase(), rc));
  });

  it('in_list - fail', () => {
    let rc = baseConfig();
    rc.testCases = ['*He*'];
    chkFalse(in_list('ignored', baseCase(), rc));
  });

});
