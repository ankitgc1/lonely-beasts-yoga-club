import { useEffect, useState } from "react";
import styled from "styled-components";
import Countdown from "react-countdown";
import {CircularProgress, Snackbar } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";

import * as anchor from "@project-serum/anchor";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletDialogButton } from "@solana/wallet-adapter-material-ui";

import {
  CandyMachine,
  awaitTransactionSignatureConfirmation,
  getCandyMachineState,
  mintOneToken,
  shortenAddress,
} from "./candy-machine";


// for the webpage 
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Navbar, Nav, Row, Col, Button, Form} from 'react-bootstrap';
import sol from './images/solana_logo.png'
import logo from './logo.svg';
import bgImg from './images/bg.jpg'
import gif from './images/yoga.png'


const ConnectButton = styled(WalletDialogButton)``;

const CounterText = styled.span``; // add your styles here

const MintContainer = styled.div``; // add your styles here

const MintButton = styled(Button)``; // add your styles here

export interface HomeProps {
  candyMachineId: anchor.web3.PublicKey;
  config: anchor.web3.PublicKey;
  connection: anchor.web3.Connection;
  startDate: number;
  treasury: anchor.web3.PublicKey;
  txTimeout: number;
}

const Home = (props: HomeProps) => {
  const [balance, setBalance] = useState<number>();
  const [isActive, setIsActive] = useState(false); // true when countdown completes
  const [isSoldOut, setIsSoldOut] = useState(false); // true when items remaining is zero
  const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT

  const [itemsAvailable, setItemsAvailable] = useState(0);
  const [itemsRedeemed, setItemsRedeemed] = useState(0);
  const [itemsRemaining, setItemsRemaining] = useState(0);

  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });

  const [startDate, setStartDate] = useState(new Date(props.startDate));

  const wallet = useAnchorWallet();
  const [candyMachine, setCandyMachine] = useState<CandyMachine>();

  const refreshCandyMachineState = () => {
    (async () => {
      if (!wallet) return;

      const {
        candyMachine,
        goLiveDate,
        itemsAvailable,
        itemsRemaining,
        itemsRedeemed,
      } = await getCandyMachineState(
        wallet as anchor.Wallet,
        props.candyMachineId,
        props.connection
      );

      setItemsAvailable(itemsAvailable);
      setItemsRemaining(itemsRemaining);
      setItemsRedeemed(itemsRedeemed);

      setIsSoldOut(itemsRemaining === 0);
      setStartDate(goLiveDate);
      setCandyMachine(candyMachine);
    })();
  };

  const onMint = async () => {
    try {
      setIsMinting(true);
      if (wallet && candyMachine?.program) {
        const mintTxId = await mintOneToken(
          candyMachine,
          props.config,
          wallet.publicKey,
          props.treasury
        );

        const status = await awaitTransactionSignatureConfirmation(
          mintTxId,
          props.txTimeout,
          props.connection,
          "singleGossip",
          false
        );

        if (!status?.err) {
          setAlertState({
            open: true,
            message: "Congratulations! Mint succeeded!",
            severity: "success",
          });
        } else {
          setAlertState({
            open: true,
            message: "Mint failed! Please try again!",
            severity: "error",
          });
        }
      }
    } catch (error: any) {
      // TODO: blech:
      let message = error.msg || "Minting failed! Please try again!";
      if (!error.msg) {
        if (error.message.indexOf("0x138")) {
        } else if (error.message.indexOf("0x137")) {
          message = `SOLD OUT!`;
        } else if (error.message.indexOf("0x135")) {
          message = `Insufficient funds to mint. Please fund your wallet.`;
        }
      } else {
        if (error.code === 311) {
          message = `SOLD OUT!`;
          setIsSoldOut(true);
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        }
      }

      setAlertState({
        open: true,
        message,
        severity: "error",
      });
    } finally {
      if (wallet) {
        const balance = await props.connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
      setIsMinting(false);
      refreshCandyMachineState();
    }
  };

  useEffect(() => {
    (async () => {
      if (wallet) {
        const balance = await props.connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
    })();
  }, [wallet, props.connection]);

  useEffect(refreshCandyMachineState, [
    wallet,
    props.candyMachineId,
    props.connection,
  ]);

  const styles = {
    backgroundImage: 'url('+bgImg+')',
    backgroundAttachment: 'fixed',
    backgroundPosition: 'center',
    // backgroundSize: 'cover',
    backgroundSize: '100%',
    minHeight: '100%',
    width: '100%',
    // height: '100vh'
  };
  
  const navitem = {
    color: 'white',
  }

  const para = {
    fontSize: '20px',
    marginBottom: '30px',
    letterSpacing: '4px',
  }

  document.title = 'lonely beasts yoga club'

  return (
    <main style={styles}>
      <Container fluid id="home">
        <Navbar className="pt-5" expand="lg">
          <Container>
            <Navbar.Brand style={navitem} href="#home">Home</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="ms-auto">
                <Nav.Link style={navitem} href="#About">About</Nav.Link>
                <Nav.Link style={navitem} href="#Roadmap">Roadmap</Nav.Link>
                <Nav.Link style={navitem} href="#FAQ">FAQ</Nav.Link>
                {/* <Nav.Link style={navitem} href="#attributes">Attributes</Nav.Link> */}
                <Nav.Link style={navitem} href="#contact-us">Contact Us</Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <Container>
          <Row className="mt-2">
            <Col className="mt-3 d-flex justify-content-center text-center">
              <img style={{borderRadius: "50%"}}
                height="100"
                alt="logo"
                src={logo}>
              </img>
            </Col>
          </Row>
          <Row>
            <Col className="d-flex justify-content-center text-center">
              <h1 className="white">Lonely Beasts Yoga Club</h1>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col className="d-flex justify-content-center text-center">
              <h2> <strong className="white">Welcome LONELY BEASTS YOGA CLUB jungle</strong> </h2>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col className="d-flex justify-content-center text-center">
              <h3>
                Built on
              </h3>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col className="d-flex justify-content-center text-center">
              <img
                height="50"
                alt="Solana"
                src={sol}>
              </img>
            </Col>
          </Row>
          <Row>
            <Col className="d-flex justify-content-center text-center">
              <div className="tran-box">
                <strong>Launch Date <br></br><br></br></strong>
                7PM UTC, 28th November 2021
              </div>
            </Col>
          </Row>
          <Row>
            <Col className="d-flex justify-content-center text-center">
              <div className="tran-box">

              {wallet && <p> <h4> Total Available: {itemsAvailable} </h4></p>}
              {wallet && <p> <h4> Redeemed: {itemsRedeemed}</h4></p>}
              {wallet && <p> <h4> Remaining: {itemsRemaining}</h4></p>}

                <MintContainer>
                  {!wallet ? (
                    <ConnectButton>Connect Wallet</ConnectButton>
                  ) : (
                    <MintButton
                      disabled={isSoldOut || isMinting || !isActive || true}
                      onClick={onMint}
                      variant="warning"
                    >
                      {isSoldOut ? (
                        "SOLD OUT"
                      ) : isActive ? (
                        isMinting ? (
                          <CircularProgress />
                        ) : (
                          "Coming Soon"
                        )
                      ) : (
                        <Countdown
                          date={startDate}
                          onMount={({ completed }) => completed && setIsActive(true)}
                          onComplete={() => setIsActive(true)}
                          renderer={renderCounter}
                        />
                      )}
                    </MintButton>
                  )}
                </MintContainer>
              </div>
            </Col>
          </Row>
          
        </Container>
      </Container>

      <div className="tran-bg" id="About">
        <Container>
        <Row>
          <Col className="mt-5" lg="8">
            <Row>
              <h1 className="white">ABOUT</h1> 
            </Row>
            <Row className="mt-2 white" style={para}>
              KoKongz story A few years ago, the KoKongz were created by accident, following a scientific experiment. They escaped from the lab and began to live in the jungle, the jungle of Solana. Initially, the KoKongz were made of gold, but today only a few are still alive, making them the rarest KoKongz in the jungle. 
            </Row>
            <Row className="mt-5 white" style={para}>
              KoKongz are as intelligent as humans and their occupation is to steal clothing or accessories from humans and wear them. 
            </Row>
            <Row className="mt-5 white" style={para}>
              Thanks to new technology, our team managed to catch them all, but we won't be able to keep them all for long, so we need your help! If you think you are strong enough to tame one of them, your help is welcome. 
            </Row>
            <Row className="mt-4 white" style={para}>
              <strong>WARNING: </strong> The rarer they are, the harder they are to tame, so be careful!
            </Row>
          </Col>
          <Col lg="4" className="d-flex justify-content-center text-center">
            <img style={{borderRadius: "50%", marginTop:"100px"}}
              height="350"
              alt=""
              src={gif}>
            </img>
          </Col>
        </Row>
        </Container>
      </div>

      <div id="FAQ">
        <Container>
          <Row className="mt-3 d-flex justify-content-center text-center">
            <Col className="mt-5">
              <h1 className="white">Frequently asked questions</h1>
            </Col>
          </Row>

          <div>
            <div className="mt-5 tran-box road-box">
              <p className="tran-para">
                <strong>Q.</strong> What is the total supply ?
              </p>
              <p className="tran-para">
                <strong>A.</strong> Only 3,333 KoKongz NFTs will be available for sale.
              </p>
            </div>
            <div className="mt-5 tran-box road-box">
              <p className="tran-para">
                <strong>Q.</strong> What's the mint price ?
              </p>
              <p className="tran-para">
                <strong>A.</strong> Mint price is 1.33 Sol, because as you can see we like "3".
              </p>
            </div>
            <div className="mt-5 tran-box road-box">
              <p className="tran-para">
                <strong>Q.</strong> Is there a limit to how many KoKongz I can mint ?
              </p>
              <p className="tran-para">
                <strong>A.</strong> Yes, 1 per transaction
              </p>
            </div>
            <div className="mt-5 tran-box road-box">
              <p className="tran-para">
                <strong>Q.</strong> Will there be a whitelist or a pre-sale ?
              </p>
              <p className="tran-para">
                <strong>A.</strong> No, but top 33 people with the most invites count on discord will win a free KoKongz.
              </p>
            </div>
            <div className="mt-5 tran-box road-box">
              <p className="tran-para">
                <strong>Q.</strong> What about secondary sale royalties ?
              </p>
              <p className="tran-para">
                <strong>A.</strong> Second sale royalties will be 3% and 50% of them will be given to a lucky holder each week.
              </p>
            </div>
            <div className="mt-5 tran-box road-box">
              <p className="tran-para">
                <strong>Q.</strong> When will you launch ?
              </p>
              <p className="tran-para">
                <strong>A.</strong> On november 28th, 7PM UTC.
              </p>
            </div>
          </div>
        </Container>
      </div>

      <div className="tran-bg pt-3 pb-5" id="contact-us">
        <Container>
          <Row className="mt-5 d-flex justify-content-center text-center">
            <Col>
              <h1 className="white">
                Follow the news about us
              </h1>
            </Col>
          </Row>
          <Row className="mt-5 mb-5 d-flex justify-content-center text-center">
            <Col>
            <a href="https://discord.gg/mFSaHEjx" target="_blank" rel="noreferrer">
            <svg className="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M464 66.52A50 50 0 00414.12 17L97.64 16A49.65 49.65 0 0048 65.52V392c0 27.3 22.28 48 49.64 48H368l-13-44 109 100zM324.65 329.81s-8.72-10.39-16-19.32C340.39 301.55 352.5 282 352.5 282a139 139 0 01-27.85 14.25 173.31 173.31 0 01-35.11 10.39 170.05 170.05 0 01-62.72-.24 184.45 184.45 0 01-35.59-10.4 141.46 141.46 0 01-17.68-8.21c-.73-.48-1.45-.72-2.18-1.21-.49-.24-.73-.48-1-.48-4.36-2.42-6.78-4.11-6.78-4.11s11.62 19.09 42.38 28.26c-7.27 9.18-16.23 19.81-16.23 19.81-53.51-1.69-73.85-36.47-73.85-36.47 0-77.06 34.87-139.62 34.87-139.62 34.87-25.85 67.8-25.12 67.8-25.12l2.42 2.9c-43.59 12.32-63.44 31.4-63.44 31.4s5.32-2.9 14.28-6.77c25.91-11.35 46.5-14.25 55-15.21a24 24 0 014.12-.49 205.62 205.62 0 0148.91-.48 201.62 201.62 0 0172.89 22.95s-19.13-18.15-60.3-30.45l3.39-3.86s33.17-.73 67.81 25.16c0 0 34.87 62.56 34.87 139.62 0-.28-20.35 34.5-73.86 36.19z"></path><path d="M212.05 218c-13.8 0-24.7 11.84-24.7 26.57s11.14 26.57 24.7 26.57c13.8 0 24.7-11.83 24.7-26.57.25-14.76-10.9-26.57-24.7-26.57zM300.43 218c-13.8 0-24.7 11.84-24.7 26.57s11.14 26.57 24.7 26.57c13.81 0 24.7-11.83 24.7-26.57S314 218 300.43 218z"></path></svg>
            </a>
            </Col>
            {/* <Col>
              <svg className="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M349.33 69.33a93.62 93.62 0 0193.34 93.34v186.66a93.62 93.62 0 01-93.34 93.34H162.67a93.62 93.62 0 01-93.34-93.34V162.67a93.62 93.62 0 0193.34-93.34h186.66m0-37.33H162.67C90.8 32 32 90.8 32 162.67v186.66C32 421.2 90.8 480 162.67 480h186.66C421.2 480 480 421.2 480 349.33V162.67C480 90.8 421.2 32 349.33 32z"></path><path d="M377.33 162.67a28 28 0 1128-28 27.94 27.94 0 01-28 28zM256 181.33A74.67 74.67 0 11181.33 256 74.75 74.75 0 01256 181.33m0-37.33a112 112 0 10112 112 112 112 0 00-112-112z"></path></svg>
            </Col> */}
            <Col>
            <a href="https://twitter.com/KokongzNFTs" target="_blank" rel="noreferrer">
            <svg className="" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M496 109.5a201.8 201.8 0 01-56.55 15.3 97.51 97.51 0 0043.33-53.6 197.74 197.74 0 01-62.56 23.5A99.14 99.14 0 00348.31 64c-54.42 0-98.46 43.4-98.46 96.9a93.21 93.21 0 002.54 22.1 280.7 280.7 0 01-203-101.3A95.69 95.69 0 0036 130.4c0 33.6 17.53 63.3 44 80.7A97.5 97.5 0 0135.22 199v1.2c0 47 34 86.1 79 95a100.76 100.76 0 01-25.94 3.4 94.38 94.38 0 01-18.51-1.8c12.51 38.5 48.92 66.5 92.05 67.3A199.59 199.59 0 0139.5 405.6a203 203 0 01-23.5-1.4A278.68 278.68 0 00166.74 448c181.36 0 280.44-147.7 280.44-275.8 0-4.2-.11-8.4-.31-12.5A198.48 198.48 0 00496 109.5z"></path></svg>        
            </a>  
            </Col>
          </Row>
          <Row className="mt-3 d-flex justify-content-center text-center">
            <Col>
              <h3>
              Copyright 2021 by lovely beasts yoga club. All rights reserved.
              </h3>
            </Col>
          </Row>
        </Container>
      </div>

      <Snackbar
        open={alertState.open}
        autoHideDuration={6000}
        onClose={() => setAlertState({ ...alertState, open: false })}
      >
        <Alert
          onClose={() => setAlertState({ ...alertState, open: false })}
          severity={alertState.severity}
        >
          {alertState.message}
        </Alert>
      </Snackbar>
    </main>
  );
};

interface AlertState {
  open: boolean;
  message: string;
  severity: "success" | "info" | "warning" | "error" | undefined;
}

const renderCounter = ({ days, hours, minutes, seconds, completed }: any) => {
  return (
    <CounterText>
      {hours + (days || 0) * 24} hours, {minutes} minutes, {seconds} seconds
    </CounterText>
  );
};

export default Home;
